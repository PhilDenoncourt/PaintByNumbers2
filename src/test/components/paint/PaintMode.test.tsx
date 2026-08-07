import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaintMode } from '../../../components/paint/PaintMode';
import { useAppStore } from '../../../state/appStore';
import type { PipelineResult, PipelineSettings, LabelOverride } from '../../../state/types';

vi.mock('../../../state/appStore', () => ({
  useAppStore: vi.fn(),
}));

type StoreState = {
  result: PipelineResult | null;
  // PaintMode reads these through useRenderLabels.
  settings: Pick<PipelineSettings, 'numberScale' | 'numberMinSize' | 'numberFont'>;
  labelOverrides: Record<number, LabelOverride>;
};

type StoreSelector = (state: StoreState) => unknown;

function makeResult(): PipelineResult {
  return {
    width: 2,
    height: 2,
    // region 0 occupies the left column, region 1 the right column.
    labelMap: Int32Array.from([0, 1, 0, 1]),
    regions: [
      { id: 0, colorIndex: 0, pixelCount: 2, boundingBox: { x: 0, y: 0, w: 1, h: 2 } },
      { id: 1, colorIndex: 1, pixelCount: 2, boundingBox: { x: 1, y: 0, w: 1, h: 2 } },
    ],
    palette: [
      [255, 0, 0],
      [0, 255, 0],
    ],
    contours: [],
    labels: [],
  };
}

function mockStore(result: PipelineResult | null) {
  (useAppStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: StoreSelector) =>
    selector({
      result,
      settings: { numberScale: 1, numberMinSize: 0, numberFont: 'sans' },
      labelOverrides: {},
    }),
  );
}

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// jsdom has no PointerEvent constructor, which leaves clientX/clientY unset on
// fireEvent.pointer*() and breaks PaintMode's tap hit-testing.
class FakePointerEvent extends MouseEvent {
  pointerId: number;
  constructor(type: string, params: MouseEventInit & { pointerId?: number } = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 0;
  }
}

describe('PaintMode', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.stubGlobal('PointerEvent', FakePointerEvent);
    (HTMLElement.prototype as unknown as { setPointerCapture: () => void }).setPointerCapture = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders nothing when there is no pipeline result', () => {
    mockStore(null);
    const { container } = render(<PaintMode onClose={onClose} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a swatch button for every palette color with regions', () => {
    mockStore(makeResult());
    render(<PaintMode onClose={onClose} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onClose when the exit button is clicked', () => {
    mockStore(makeResult());
    render(<PaintMode onClose={onClose} />);
    fireEvent.click(screen.getByText('paintMode.exit'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', () => {
    mockStore(makeResult());
    render(<PaintMode onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose for other keys', () => {
    mockStore(makeResult());
    render(<PaintMode onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('selecting a color swatch shows the "toggle all" action for that color', () => {
    mockStore(makeResult());
    render(<PaintMode onClose={onClose} />);
    expect(screen.queryByText('paintMode.toggleAll')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('1').closest('button')!);
    expect(screen.getByText('paintMode.toggleAll')).toBeInTheDocument();
  });

  it('clicking the active swatch again deselects it', () => {
    mockStore(makeResult());
    render(<PaintMode onClose={onClose} />);
    const swatch = screen.getByText('1').closest('button')!;

    fireEvent.click(swatch);
    expect(screen.getByText('paintMode.toggleAll')).toBeInTheDocument();

    fireEvent.click(swatch);
    expect(screen.queryByText('paintMode.toggleAll')).not.toBeInTheDocument();
  });

  it('tapping a region on the canvas paints it and activates its color', () => {
    // jsdom never lays elements out, so give every element a 200x200 client box
    // before mount — PaintMode fits the canvas to its container on first render.
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { value: 200, configurable: true });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { value: 200, configurable: true });

    mockStore(makeResult());
    const { container } = render(<PaintMode onClose={onClose} />);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    canvas.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 200, bottom: 200, width: 200, height: 200, x: 0, y: 0, toJSON: () => {} }) as DOMRect;

    // image is 2x2 fit into 200x200 -> scale ~95, offset ~5; (20,100) lands in
    // the left half of the image -> region 0 / color 0.
    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 20, clientY: 100, pointerId: 1 });

    expect(screen.getByText('paintMode.toggleAll')).toBeInTheDocument();

    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  });

  it('a drag (pointer move beyond the tap threshold) pans instead of painting', () => {
    mockStore(makeResult());
    const { container } = render(<PaintMode onClose={onClose} />);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    canvas.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 200, bottom: 200, width: 200, height: 200, x: 0, y: 0, toJSON: () => {} }) as DOMRect;

    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 90, clientY: 90, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 90, clientY: 90, pointerId: 1 });

    expect(screen.queryByText('paintMode.toggleAll')).not.toBeInTheDocument();
  });
});
