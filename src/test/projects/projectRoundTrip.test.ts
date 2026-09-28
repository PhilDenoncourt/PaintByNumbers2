import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings, useAppStore } from '../../state/appStore';
import { dataUrlToBlob, parseProjectFile, serializeProjectFile, validateProject } from '../../projects/projectCodec';
import { generateSvg } from '../../export/svgExporter';
import { runPipeline } from '../../pipeline/PipelineController';
import type { LocalProject } from '../../projects/types';
import type { PipelineResult } from '../../state/types';

vi.mock('../../utils/imageLoader', () => ({
  loadImageFromFile: vi.fn().mockResolvedValue({ src: 'blob:restored', naturalWidth: 2, naturalHeight: 1 }),
  imageToImageData: vi.fn().mockReturnValue({ imageData: new ImageData(new Uint8ClampedArray(8), 2, 1) }),
  applyCropRotate: vi.fn().mockReturnValue({ imageData: new ImageData(new Uint8ClampedArray(8), 2, 1) }),
}));
vi.mock('../../pipeline/PipelineController', () => ({ runPipeline: vi.fn() }));

const result = (): PipelineResult => ({
  width: 2, height: 1, labelMap: new Int32Array([1, 1]),
  palette: [[255, 0, 0], [0, 0, 255]],
  regions: [{ id: 1, colorIndex: 0, pixelCount: 2, boundingBox: { x: 0, y: 0, w: 2, h: 1 } }],
  contours: [{ regionId: 1, colorIndex: 0, outerRing: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }], holes: [] }],
  labels: [{ regionId: 1, colorIndex: 0, x: 1, y: 0.5, maxInscribedRadius: 1 }],
});

function project(): LocalProject {
  const current = result();
  return { version: 1, id: 'project-1', revision: 1, createdAt: 1, updatedAt: 2,
    thumbnail: '', source: new Blob([new Uint8Array([1])], { type: 'image/png' }),
    settings: { ...defaultSettings }, result: current, resultSettings: { ...defaultSettings },
    labelOverrides: {}, paletteColorOrder: null,
    history: [{ id: 'step-1', resultId: 'step-1', settings: { ...defaultSettings }, result: current,
      resultSettings: { ...defaultSettings }, labelOverrides: {}, paletteColorOrder: null, timestamp: 1 }],
    historyIndex: 0, historyTruncated: false, viewMode: 'colored', activePanel: 'refine' };
}

describe('local project round trip', () => {
  beforeEach(() => useAppStore.getState().reset());

  it('restores an edited result with a live source, history, and matching SVG export', async () => {
    const saved = validateProject(project());
    const originalSvg = generateSvg(saved.result!, true);
    await useAppStore.getState().restoreProject(saved);
    const restored = useAppStore.getState();
    expect(restored.sourceImage).not.toBeNull();
    expect(restored.pipeline.status).toBe('complete');
    expect(restored.result?.labelMap).toBeInstanceOf(Int32Array);
    expect(generateSvg(restored.result!, true)).toBe(originalSvg);
    restored.changeRegionColor(1, 1);
    expect(useAppStore.getState().historyIndex).toBe(1);
    restored.undo();
    expect(generateSvg(useAppStore.getState().result!, true)).toBe(originalSvg);
    restored.redo();
    expect(useAppStore.getState().result?.regions[0].colorIndex).toBe(1);
  });

  it('accepts legacy numeric-key label maps and rejects invalid files without changing the editor', async () => {
    const old = { settings: { paletteSize: 5 }, result: { ...result(), labelMap: { 0: 1, 1: 1 } },
      sourceImageBase64: 'data:image/png;base64,AQ==', timestamp: 10 };
    const imported = await parseProjectFile({ text: async () => JSON.stringify(old) } as Blob);
    expect(imported.result?.labelMap).toEqual(new Int32Array([1, 1]));
    expect(imported.settings.rotation).toBe(0);
    expect(imported.history).toHaveLength(1);
    await useAppStore.getState().restoreProject(imported);
    const before = useAppStore.getState().result;
    await expect(parseProjectFile({ text: async () => JSON.stringify({ ...old, result: { ...old.result, width: 3 } }) } as Blob)).rejects.toThrow();
    expect(useAppStore.getState().result).toBe(before);
  });

  it('exports a versioned file with an array label map and restores its redo branch', async () => {
    const saved = project();
    saved.history.push({ ...saved.history[0], id: 'step-2', resultId: 'step-2', result: result(), timestamp: 2 });
    saved.historyIndex = 0;
    const json = await serializeProjectFile(saved);
    expect(JSON.parse(json).result.labelMap).toEqual([1, 1]);
    const imported = await parseProjectFile({ text: async () => json } as Blob);
    expect(imported.historyIndex).toBe(0);
    await useAppStore.getState().restoreProject(imported);
    useAppStore.getState().redo();
    expect(useAppStore.getState().historyIndex).toBe(1);
  });

  it('rejects unsupported versions and invalid source encodings', () => {
    expect(() => validateProject({ ...project(), version: 2 })).toThrow('Unsupported project version');
    expect(() => dataUrlToBlob('javascript:alert(1)')).toThrow('Invalid source image');
  });

  it('ignores a pipeline completion from a project that has been replaced', async () => {
    let finish!: (value: PipelineResult) => void;
    vi.mocked(runPipeline).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    await useAppStore.getState().restoreProject(project());
    const running = useAppStore.getState().startPipeline();
    await useAppStore.getState().loadImage(new File([new Uint8Array([2])], 'new.png', { type: 'image/png' }));
    finish(result());
    await running;
    expect(useAppStore.getState().result).toBeNull();
    expect(useAppStore.getState().history).toHaveLength(0);
  });
});
