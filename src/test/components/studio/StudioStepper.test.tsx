import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StudioStepper } from '../../../components/studio/StudioStepper';
import { useAppStore } from '../../../state/appStore';
import type { ActivePanel } from '../../../state/types';
import type { PipelineResult } from '../../../state/types';

vi.mock('../../../state/appStore', () => ({
  useAppStore: vi.fn(),
}));

type StoreState = {
  ui: { activePanel: ActivePanel; darkMode: boolean };
  setActivePanel: (panel: ActivePanel) => void;
  result: PipelineResult | null;
};

type StoreSelector = (state: StoreState) => unknown;

function mockStore(activePanel: ActivePanel, result: PipelineResult | null, setActivePanel = vi.fn()) {
  (useAppStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: StoreSelector) =>
    selector({ ui: { activePanel, darkMode: false }, setActivePanel, result }),
  );
  return setActivePanel;
}

describe('StudioStepper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks the active step with aria-current', () => {
    mockStore('adjust', null);
    render(<StudioStepper />);
    expect(screen.getByText('panels.adjust.tab').closest('button')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('panels.palette.tab').closest('button')).not.toHaveAttribute('aria-current');
  });

  it('locks the refine and export steps until a result exists', () => {
    mockStore('palette', null);
    render(<StudioStepper />);
    expect(screen.getByText('panels.refine.tab').closest('button')).toBeDisabled();
    expect(screen.getByText('panels.export.tab').closest('button')).toBeDisabled();
    expect(screen.getByText('panels.palette.tab').closest('button')).toBeEnabled();
    expect(screen.getByText('panels.adjust.tab').closest('button')).toBeEnabled();
  });

  it('unlocks the refine and export steps once a result exists', () => {
    mockStore('palette', {} as PipelineResult);
    render(<StudioStepper />);
    expect(screen.getByText('panels.refine.tab').closest('button')).toBeEnabled();
    expect(screen.getByText('panels.export.tab').closest('button')).toBeEnabled();
  });

  it('clicking an unlocked step calls setActivePanel', () => {
    const setActivePanel = mockStore('palette', null);
    render(<StudioStepper />);
    screen.getByText('panels.adjust.tab').closest('button')!.click();
    expect(setActivePanel).toHaveBeenCalledWith('adjust');
  });

  it('clicking a locked step does not call setActivePanel', () => {
    const setActivePanel = mockStore('palette', null);
    render(<StudioStepper />);
    screen.getByText('panels.refine.tab').closest('button')!.click();
    expect(setActivePanel).not.toHaveBeenCalled();
  });
});
