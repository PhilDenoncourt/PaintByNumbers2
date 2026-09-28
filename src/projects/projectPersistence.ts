import { useSyncExternalStore } from 'react';
import { useAppStore } from '../state/appStore';
import { projectRepository, ProjectConflictError } from './projectRepository';
import { exportProjectFile, parseProjectFile } from './projectCodec';
import type { LocalProject, ProjectMetadata } from './types';

export type SaveStatus = 'loading' | 'idle' | 'saving' | 'saved' | 'error' | 'conflict';
interface Snapshot { metadata: ProjectMetadata | null; status: SaveStatus; error: string | null; remember: boolean }
let snapshot: Snapshot = { metadata: null, status: 'loading', error: null, remember: true };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const getSnapshot = () => snapshot;
function update(partial: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...partial };
  listeners.forEach((listener) => listener());
}
export function useProjectPersistence(): Snapshot {
  return useSyncExternalStore(subscribe, getSnapshot);
}

let started = false;
let hydrated = false;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let maxTimer: ReturnType<typeof setTimeout> | null = null;
let queued = Promise.resolve();
let savedStoreRevision = -1;
let expectedRevision: number | null = null;
let lastResult: LocalProject['result'] = null;
let lastResultSettings: LocalProject['resultSettings'] = null;

function buildProject(): LocalProject | null {
  const s = useAppStore.getState();
  if (!s.sourceBlob || !s.projectId) return null;
  const now = Date.now();
  const result = s.pipeline.status === 'running' ? lastResult : s.result;
  const resultSettings = s.pipeline.status === 'running' ? lastResultSettings : s.resultSettings;
  let thumbnail = snapshot.metadata?.id === s.projectId ? snapshot.metadata.thumbnail : '';
  if (!thumbnail && s.sourceImage) {
    const canvas = document.createElement('canvas');
    const ratio = Math.min(160 / s.sourceImage.naturalWidth, 120 / s.sourceImage.naturalHeight, 1);
    canvas.width = Math.max(1, Math.round(s.sourceImage.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(s.sourceImage.naturalHeight * ratio));
    canvas.getContext('2d')?.drawImage(s.sourceImage, 0, 0, canvas.width, canvas.height);
    thumbnail = canvas.toDataURL('image/jpeg', 0.7);
  }
  return {
    version: 1, id: s.projectId, revision: expectedRevision ?? 0,
    createdAt: s.projectCreatedAt, updatedAt: now,
    thumbnail, source: s.sourceBlob, settings: s.settings,
    result, resultSettings, labelOverrides: s.labelOverrides,
    paletteColorOrder: s.paletteColorOrder, history: s.history, historyIndex: s.historyIndex,
    historyTruncated: s.historyTruncated,
    viewMode: s.ui.viewMode, activePanel: s.ui.activePanel,
  };
}

function clearTimers() {
  if (pendingTimer) clearTimeout(pendingTimer);
  if (maxTimer) clearTimeout(maxTimer);
  pendingTimer = maxTimer = null;
}

async function write(): Promise<void> {
  clearTimers();
  if (!snapshot.remember || snapshot.status === 'conflict') return;
  const s = useAppStore.getState();
  if (s.durableRevision === savedStoreRevision || !s.sourceBlob) return;
  const project = buildProject();
  if (!project) return;
  const revisionAtStart = s.durableRevision;
  update({ status: 'saving', error: null });
  try {
    const nextRevision = await projectRepository.save(project, expectedRevision);
    expectedRevision = nextRevision;
    savedStoreRevision = revisionAtStart;
    update({ metadata: { id: project.id, revision: nextRevision, createdAt: project.createdAt,
      updatedAt: project.updatedAt, thumbnail: project.thumbnail },
      status: useAppStore.getState().durableRevision === revisionAtStart ? 'saved' : 'saving' });
    if (useAppStore.getState().durableRevision !== revisionAtStart) schedule();
  } catch (error) {
    update({ status: error instanceof ProjectConflictError ? 'conflict' : 'error',
      error: error instanceof Error ? error.message : 'Could not save project' });
  }
}

function schedule(immediate = false) {
  if (!hydrated || !snapshot.remember || snapshot.status === 'conflict') return;
  if (!useAppStore.getState().sourceBlob) return;
  update({ status: 'saving' });
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => { queued = queued.then(write); }, immediate ? 0 : 1000);
  if (!maxTimer) maxTimer = setTimeout(() => { queued = queued.then(write); }, 5000);
}

export const projectPersistence = {
  async initialize(): Promise<void> {
    if (started) return;
    started = true;
    useAppStore.subscribe((state, previous) => {
      if (state.projectId !== previous.projectId) {
        lastResult = state.result;
        lastResultSettings = state.resultSettings;
      } else if (state.result && state.pipeline.status !== 'running') {
        lastResult = state.result;
        lastResultSettings = state.resultSettings;
      }
      if (state.durableRevision !== previous.durableRevision && state.sourceBlob) {
        schedule(state.result !== previous.result || state.sourceBlob !== previous.sourceBlob);
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void projectPersistence.saveNow();
    });
    window.addEventListener('pagehide', () => { void projectPersistence.saveNow(); });
    try {
      const metadata = await projectRepository.migrateLegacy();
      expectedRevision = metadata?.revision ?? null;
      update({ metadata, status: 'idle' });
    } catch (error) {
      update({ status: 'error', error: error instanceof Error ? error.message : 'Storage unavailable' });
    } finally {
      hydrated = true;
      if (useAppStore.getState().sourceBlob) schedule(true);
    }
  },
  async saveNow(): Promise<void> {
    clearTimers();
    queued = queued.then(write);
    await queued;
  },
  async resume(): Promise<void> {
    clearTimers();
    await queued;
    const project = await projectRepository.load();
    if (!project) throw new Error('Saved project was not found');
    hydrated = false;
    try {
      await useAppStore.getState().restoreProject(project);
      expectedRevision = project.revision;
      savedStoreRevision = useAppStore.getState().durableRevision;
      lastResult = project.result;
      lastResultSettings = project.resultSettings;
      update({ status: 'saved', metadata: { id: project.id, revision: project.revision,
        createdAt: project.createdAt, updatedAt: project.updatedAt, thumbnail: project.thumbnail } });
    } finally { hydrated = true; }
  },
  async importFile(file: File): Promise<void> {
    const project = await parseProjectFile(file);
    clearTimers();
    await queued;
    hydrated = false;
    try {
      await useAppStore.getState().restoreProject({ ...project, id: crypto.randomUUID(), revision: 0,
        createdAt: Date.now(), updatedAt: Date.now() });
      lastResult = project.result;
      lastResultSettings = project.resultSettings;
    } finally { hydrated = true; }
    schedule(true);
  },
  async downloadCurrent(): Promise<void> {
    const project = buildProject();
    if (project) await exportProjectFile(project);
  },
  async downloadSaved(): Promise<void> {
    const project = await projectRepository.load();
    if (project) await exportProjectFile(project);
  },
  async deleteSaved(): Promise<void> {
    clearTimers();
    await queued;
    await projectRepository.delete();
    expectedRevision = null;
    savedStoreRevision = -1;
    update({ metadata: null, status: 'idle', remember: useAppStore.getState().sourceBlob ? false : snapshot.remember });
  },
  setRemember(value: boolean) {
    update({ remember: value, status: value ? 'idle' : snapshot.status });
    if (value) schedule(true);
    else clearTimers();
  },
  async reloadLatest() { await this.resume(); },
};
