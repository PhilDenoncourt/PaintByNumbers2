import type { LocalProject, ProjectMetadata, ProjectCheckpoint } from './types';
import { validateProject, parseProjectFile } from './projectCodec';
import { loadImageFromFile, applyCropRotate } from '../utils/imageLoader';

const DB_NAME = 'pbn-local-project';
const DB_VERSION = 1;
const KEY = 'last';
const META_KEY = 'metadata';

export class ProjectConflictError extends Error {
  constructor() { super('A newer project was saved in another tab'); }
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Database request failed'));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('Database transaction aborted'));
    tx.onerror = () => reject(tx.error ?? new Error('Database transaction failed'));
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;
function openDatabase(): Promise<IDBDatabase> {
  if (!('indexedDB' in window)) return Promise.reject(new Error('Browser storage is unavailable'));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    let rejected = false;
    const timer = setTimeout(() => { rejected = true; reject(new Error('Close other tabs to update local project storage')); }, 5000);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore('projects');
      db.createObjectStore('assets');
      db.createObjectStore('history');
    };
    req.onblocked = () => { clearTimeout(timer); rejected = true; reject(new Error('Close other tabs to update local project storage')); };
    req.onerror = () => { clearTimeout(timer); reject(req.error ?? new Error('Could not open local storage')); };
    req.onsuccess = () => {
      clearTimeout(timer);
      const db = req.result;
      if (rejected) { db.close(); return; }
      db.onversionchange = () => db.close();
      resolve(db);
    };
  }).catch((error) => { dbPromise = null; throw error; });
  return dbPromise;
}

interface StoredProject extends Omit<LocalProject, 'source' | 'history' | 'result'> {
  result?: LocalProject['result'];
  currentResultId: string | null;
  historyIds: string[];
  historyResultIds: string[];
}
interface StoredMetadata extends ProjectMetadata {
  historyIds: string[];
  historyResultIds: string[];
}

export const projectRepository = {
  async metadata(): Promise<ProjectMetadata | null> {
    const db = await openDatabase();
    const tx = db.transaction('projects', 'readonly');
    const done = transactionDone(tx);
    const stored = await request(tx.objectStore('projects').get(META_KEY)) as StoredMetadata | undefined;
    await done;
    return stored ? { id: stored.id, revision: stored.revision, createdAt: stored.createdAt,
      updatedAt: stored.updatedAt, thumbnail: stored.thumbnail } : null;
  },

  async load(): Promise<LocalProject | null> {
    const db = await openDatabase();
    const tx = db.transaction(['projects', 'assets', 'history'], 'readonly');
    const done = transactionDone(tx);
    const projects = tx.objectStore('projects');
    const stored = await request(projects.get(KEY)) as StoredProject | undefined;
    if (!stored) { await done; return null; }
    const source = await request(tx.objectStore('assets').get(stored.id)) as Blob | undefined;
    const historyStore = tx.objectStore('history');
    const rawHistory = await Promise.all(stored.historyIds.map((id) => request(historyStore.get(id)))) as ProjectCheckpoint[];
    const uniqueResultIds = [...new Set(rawHistory.map((entry) => entry.resultId).filter((id): id is string => !!id))];
    const results = new Map(await Promise.all(uniqueResultIds.map(async (id) =>
      [id, await request(historyStore.get(`result:${id}`))] as const)));
    const history = rawHistory.map((entry) => ({ ...entry, result: entry.resultId ? results.get(entry.resultId) : null }));
    await done;
    const currentResult = stored.currentResultId ? results.get(stored.currentResultId) : stored.result;
    if (stored.currentResultId && !currentResult) throw new Error('Missing saved result');
    return validateProject({ ...stored, result: currentResult ?? null, source, history });
  },

  async save(project: LocalProject, expectedRevision: number | null): Promise<number> {
    const db = await openDatabase();
    const tx = db.transaction(['projects', 'assets', 'history'], 'readwrite');
    const done = transactionDone(tx);
    const projects = tx.objectStore('projects');
    const previous = await request(projects.get(META_KEY)) as StoredMetadata | undefined;
    if ((previous?.revision ?? null) !== expectedRevision) {
      tx.abort();
      await done.catch(() => {});
      throw new ProjectConflictError();
    }
    const revision = (previous?.revision ?? 0) + 1;
    const historyIds = project.history.map((entry) => entry.id);
    const historyResultIds = [...new Set(project.history.map((entry) => entry.resultId).filter((id): id is string => !!id))];
    const currentResultId = project.history.find((entry) => entry.result && entry.result === project.result)?.resultId ?? null;
    const stored: StoredProject = { ...project, revision, source: undefined, history: undefined,
      result: currentResultId ? undefined : project.result, currentResultId,
      historyIds, historyResultIds } as unknown as StoredProject;
    projects.put(stored, KEY);
    projects.put({ id: project.id, revision, createdAt: project.createdAt,
      updatedAt: project.updatedAt, thumbnail: project.thumbnail, historyIds, historyResultIds } satisfies StoredMetadata, META_KEY);
    if (!previous || previous.id !== project.id) tx.objectStore('assets').put(project.source, project.id);
    const historyStore = tx.objectStore('history');
    const previousIds = new Set(previous?.historyIds ?? []);
    const previousResultIds = new Set(previous?.historyResultIds ?? []);
    const oldIds = previous?.id === project.id ? previousIds : new Set<string>();
    const oldResultIds = previous?.id === project.id ? previousResultIds : new Set<string>();
    for (const entry of project.history) if (!oldIds.has(entry.id)) {
      historyStore.put({ ...entry, result: undefined }, entry.id);
      if (entry.resultId && !oldResultIds.has(entry.resultId)) historyStore.put(entry.result, `result:${entry.resultId}`);
    }
    for (const id of previousIds) if (!historyIds.includes(id)) historyStore.delete(id);
    for (const id of previousResultIds) if (!historyResultIds.includes(id)) historyStore.delete(`result:${id}`);
    if (previous && previous.id !== project.id) tx.objectStore('assets').delete(previous.id);
    await done;
    return revision;
  },

  async delete(): Promise<void> {
    const db = await openDatabase();
    const tx = db.transaction(['projects', 'assets', 'history'], 'readwrite');
    const done = transactionDone(tx);
    const previous = await request(tx.objectStore('projects').get(META_KEY)) as StoredMetadata | undefined;
    tx.objectStore('projects').delete(KEY);
    tx.objectStore('projects').delete(META_KEY);
    if (previous) {
      tx.objectStore('assets').delete(previous.id);
      for (const id of previous.historyIds) tx.objectStore('history').delete(id);
      for (const id of previous.historyResultIds ?? []) tx.objectStore('history').delete(`result:${id}`);
    }
    await done;
    try { localStorage.removeItem('pbn_session'); } catch { /* IndexedDB deletion succeeded. */ }
  },

  async migrateLegacy(): Promise<ProjectMetadata | null> {
    const existing = await this.metadata();
    if (existing) return existing;
    let legacy: string | null;
    try { legacy = localStorage.getItem('pbn_session'); } catch { return null; }
    if (!legacy) return null;
    const project = await parseProjectFile(new Blob([legacy], { type: 'application/json' }));
    const image = await loadImageFromFile(new File([project.source], 'legacy-image', { type: project.source.type }));
    try {
      if (project.result && project.resultSettings) {
        const { imageData } = applyCropRotate(image, project.resultSettings.cropRect, project.resultSettings.rotation);
        if (imageData.width !== project.result.width || imageData.height !== project.result.height) throw new Error('Legacy image and result dimensions do not match');
      }
    } finally { URL.revokeObjectURL(image.src); }
    await this.save(project, null);
    const verified = await this.load();
    if (!verified) throw new Error('Could not verify migrated project');
    try { localStorage.removeItem('pbn_session'); } catch { /* The verified copy is in IndexedDB. */ }
    return this.metadata();
  },
};
