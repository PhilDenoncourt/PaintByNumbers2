import type { PipelineResult, PipelineSettings, LabelOverride } from '../state/types';
import { defaultSettings } from '../state/appStore';
import type { LocalProject, ProjectCheckpoint } from './types';

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid project structure');
  return value as Record<string, unknown>;
}

function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid project number');
  return value;
}

function settings(value: unknown): PipelineSettings {
  const next = { ...defaultSettings, ...record(value) } as PipelineSettings;
  if (![0, 90, 180, 270].includes(next.rotation) ||
      !Number.isFinite(next.paletteSize) || next.paletteSize < 1 || next.paletteSize > 256) throw new Error('Invalid settings');
  if (next.cropRect) {
    const c = next.cropRect;
    if ([c.x, c.y, c.w, c.h].some((v) => !Number.isFinite(v)) || c.x < 0 || c.y < 0 ||
        c.w <= 0 || c.h <= 0 || c.x + c.w > 1.001 || c.y + c.h > 1.001) throw new Error('Invalid crop');
  }
  return next;
}

function labelMap(value: unknown, size: number): Int32Array {
  let values: number[];
  if (value instanceof Int32Array) return value.length === size ? value : fail('Invalid label map size');
  if (Array.isArray(value)) values = value;
  else {
    const obj = record(value);
    values = Array.from({ length: size }, (_, i) => obj[String(i)] as number);
    if (Object.keys(obj).length !== size) throw new Error('Invalid label map');
  }
  if (values.length !== size || values.some((v) => !Number.isInteger(v))) throw new Error('Invalid label map');
  return Int32Array.from(values);
}

function fail(message: string): never { throw new Error(message); }

function result(value: unknown, cache?: WeakMap<object, PipelineResult>): PipelineResult | null {
  if (value === null || value === undefined) return null;
  if (cache?.has(value as object)) return cache.get(value as object)!;
  const raw = record(value);
  const width = number(raw.width);
  const height = number(raw.height);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > 4_000_000) throw new Error('Invalid result dimensions');
  if (!Array.isArray(raw.palette) || !Array.isArray(raw.regions) || !Array.isArray(raw.contours) || !Array.isArray(raw.labels)) throw new Error('Incomplete result');
  const palette = raw.palette as number[][];
  if (palette.length < 1 || palette.length > 256 || palette.some((rgb) => !Array.isArray(rgb) || rgb.length !== 3 || rgb.some((v) => !Number.isInteger(v) || v < 0 || v > 255))) throw new Error('Invalid palette');
  const map = labelMap(raw.labelMap, width * height);
  const validColor = (item: unknown) => {
    const obj = record(item);
    return Number.isInteger(obj.colorIndex) && (obj.colorIndex as number) >= 0 && (obj.colorIndex as number) < palette.length;
  };
  if ([...raw.regions, ...raw.contours, ...raw.labels].some((item) => !validColor(item))) throw new Error('Invalid palette reference');
  for (const item of raw.regions) {
    const region = record(item);
    if (!Number.isInteger(region.id) || number(region.pixelCount) < 0) throw new Error('Invalid region');
    const box = record(region.boundingBox);
    for (const key of ['x', 'y', 'w', 'h']) number(box[key]);
  }
  const point = (value: unknown) => { const p = record(value); number(p.x); number(p.y); };
  for (const item of raw.contours) {
    const contour = record(item);
    if (!Number.isInteger(contour.regionId) || !Array.isArray(contour.outerRing) || !Array.isArray(contour.holes)) throw new Error('Invalid contour');
    contour.outerRing.forEach(point);
    contour.holes.forEach((hole: unknown) => { if (!Array.isArray(hole)) throw new Error('Invalid contour hole'); hole.forEach(point); });
  }
  for (const item of raw.labels) {
    const label = record(item);
    if (!Number.isInteger(label.regionId)) throw new Error('Invalid label');
    for (const key of ['x', 'y', 'maxInscribedRadius']) number(label[key]);
  }
  const parsed = { ...raw, width, height, labelMap: map } as unknown as PipelineResult;
  cache?.set(value as object, parsed);
  return parsed;
}

function overrides(value: unknown): Record<number, LabelOverride> {
  if (value == null) return {};
  const raw = record(value);
  for (const item of Object.values(raw)) {
    const ov = record(item);
    for (const key of ['x', 'y', 'anchorX', 'anchorY', 'colorIndex']) number(ov[key]);
  }
  return raw as Record<number, LabelOverride>;
}

function order(value: unknown, length: number): number[] | null {
  if (value == null) return null;
  if (!Array.isArray(value) || value.length !== length || new Set(value).size !== length ||
      value.some((v) => !Number.isInteger(v) || v < 0 || v >= length)) throw new Error('Invalid palette order');
  return value;
}

function checkpoint(value: unknown, cache: WeakMap<object, PipelineResult>): ProjectCheckpoint {
  const raw = record(value);
  const parsed = result(raw.result, cache);
  return {
    id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
    resultId: typeof raw.resultId === 'string' ? raw.resultId : parsed ? String(raw.id ?? crypto.randomUUID()) : null,
    settings: settings(raw.settings), result: parsed,
    resultSettings: raw.resultSettings ? settings(raw.resultSettings) : parsed ? settings(raw.settings) : null,
    labelOverrides: overrides(raw.labelOverrides),
    paletteColorOrder: order(raw.paletteColorOrder, parsed?.palette.length ?? 0),
    timestamp: number(raw.timestamp),
  };
}

export function validateProject(value: unknown): LocalProject {
  const raw = record(value);
  if (raw.version !== 1) throw new Error('Unsupported project version');
  if (!(raw.source instanceof Blob) || raw.source.size === 0 || !raw.source.type.startsWith('image/')) throw new Error('Missing source image');
  const cache = new WeakMap<object, PipelineResult>();
  const parsed = result(raw.result, cache);
  const history = Array.isArray(raw.history) ? raw.history.map((entry) => checkpoint(entry, cache)) : fail('Invalid history');
  if (history.length > 20) throw new Error('Project history is too large');
  const historyIndex = number(raw.historyIndex);
  if (!Number.isInteger(historyIndex) || historyIndex < -1 || historyIndex >= history.length || (history.length > 0 && historyIndex < 0)) throw new Error('Invalid history cursor');
  if (history.some((entry) => Boolean(entry.resultId) !== Boolean(entry.result))) throw new Error('Invalid history result');
  const currentOverrides = overrides(raw.labelOverrides);
  if (parsed && Object.values(currentOverrides).some((item) => item.colorIndex < 0 || item.colorIndex >= parsed.palette.length)) throw new Error('Invalid number color');
  for (const entry of history) if (entry.result && Object.values(entry.labelOverrides).some((item) =>
    item.colorIndex < 0 || item.colorIndex >= entry.result!.palette.length)) throw new Error('Invalid history number color');
  return {
    version: 1, id: String(raw.id), revision: number(raw.revision),
    createdAt: number(raw.createdAt), updatedAt: number(raw.updatedAt),
    thumbnail: typeof raw.thumbnail === 'string' ? raw.thumbnail : '', source: raw.source,
    settings: settings(raw.settings), result: parsed,
    resultSettings: raw.resultSettings ? settings(raw.resultSettings) : parsed ? settings(raw.settings) : null,
    labelOverrides: currentOverrides,
    paletteColorOrder: order(raw.paletteColorOrder, parsed?.palette.length ?? 0),
    history, historyIndex,
    historyTruncated: raw.historyTruncated === true,
    viewMode: ['colored', 'print', 'sidebyside', 'overlay'].includes(String(raw.viewMode)) ? raw.viewMode as LocalProject['viewMode'] : 'colored',
    activePanel: ['palette', 'adjust', 'refine', 'export'].includes(String(raw.activePanel)) ? raw.activePanel as LocalProject['activePanel'] : 'palette',
  };
}

export function dataUrlToBlob(url: string): Blob {
  const match = /^data:(image\/[-\w.+]+);base64,([\s\S]+)$/.exec(url);
  if (!match) throw new Error('Invalid source image');
  const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: match[1] });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read source image'));
    reader.readAsDataURL(blob);
  });
}

export async function parseProjectFile(file: Blob): Promise<LocalProject> {
  const raw = record(JSON.parse(await file.text()));
  if (raw.version === undefined) {
    const timestamp = typeof raw.timestamp === 'number' ? raw.timestamp : Date.now();
    const parsed = result(raw.result);
    const baseline: ProjectCheckpoint[] = parsed ? [{ id: crypto.randomUUID(), resultId: crypto.randomUUID(), settings: settings(raw.settings), result: parsed,
      resultSettings: settings(raw.settings), labelOverrides: overrides(raw.labelOverrides), paletteColorOrder: null, timestamp }] : [];
    return validateProject({ version: 1, id: crypto.randomUUID(), revision: 0, createdAt: timestamp, updatedAt: timestamp,
      thumbnail: raw.sourceImageBase64, source: dataUrlToBlob(String(raw.sourceImageBase64)), settings: raw.settings,
      result: parsed, resultSettings: parsed ? raw.settings : null, labelOverrides: raw.labelOverrides,
      paletteColorOrder: null, history: baseline, historyIndex: baseline.length - 1, viewMode: 'colored', activePanel: 'palette' });
  }
  if (raw.version !== 1) throw new Error('Unsupported project version');
  const source = dataUrlToBlob(String(raw.sourceImageBase64));
  if (typeof raw.currentResultId === 'string' && Array.isArray(raw.history)) {
    const current = raw.history.find((entry: unknown) => record(entry).resultId === raw.currentResultId) as Record<string, unknown> | undefined;
    if (current) raw.result = current.result;
  }
  return validateProject({ ...raw, source });
}

export async function serializeProjectFile(project: LocalProject): Promise<string> {
  const sourceImageBase64 = await blobToDataUrl(project.source);
  const currentResultId = project.history.find((entry) => entry.result && entry.result === project.result)?.resultId ?? null;
  return JSON.stringify({ ...project, source: undefined, sourceImageBase64, currentResultId },
    (_key, value) => value instanceof Int32Array ? Array.from(value) : value);
}

export async function exportProjectFile(project: LocalProject): Promise<void> {
  const json = await serializeProjectFile(project);
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `paint-by-numbers-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
