import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetailControls } from '../../../components/controls/DetailControls';
import { useAppStore } from '../../../state/appStore';

// Mock the Zustand store
vi.mock('../../../state/appStore', () => ({
  useAppStore: vi.fn(),
}));

type StoreState = {
  settings: Record<string, unknown>;
  pipeline: Record<string, unknown>;
  updateSettings: (settings: Record<string, unknown>) => void;
};

type StoreSelector = (state: StoreState) => unknown;

describe('DetailControls', () => {
  const mockUpdateSettings = vi.fn();

  beforeEach(() => {
    mockUpdateSettings.mockClear();
    
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: StoreSelector) => {
      const state = {
        settings: {
          detailLevel: 50,
          minRegionSize: 135,
          paletteSize: 12,
          algorithm: 'kmeans',
          simplificationEpsilon: 1.5,
          presetPaletteId: null,
          customPalette: null,
          brightness: 0,
          contrast: 0,
          saturation: 0,
          borderWidth: 0,
          smoothingPasses: 0,
          preserveCorners: false,
        },
        pipeline: {
          status: 'idle',
          currentStage: null,
          stageProgress: 0,
          error: null,
        },
        updateSettings: mockUpdateSettings,
      };
      return selector(state);
    });
  });

  it('should render difficulty level buttons', () => {
    render(<DetailControls />);
    const buttons = screen.getAllByRole('button');
    // Should have at least the difficulty buttons
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should apply simple difficulty preset', () => {
    render(<DetailControls />);
    const buttons = screen.getAllByRole('button');
    const simpleButton = buttons[0];
    fireEvent.click(simpleButton);
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      detailLevel: 0,
      minRegionSize: 510,
    });
  });

  it('should apply medium difficulty preset', () => {
    render(<DetailControls />);
    const buttons = screen.getAllByRole('button');
    const mediumButton = buttons[1];
    fireEvent.click(mediumButton);
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      detailLevel: 50,
      minRegionSize: 135,
    });
  });

  it('should apply complex difficulty preset', () => {
    render(<DetailControls />);
    const buttons = screen.getAllByRole('button');
    const complexButton = buttons[2];
    fireEvent.click(complexButton);
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      detailLevel: 100,
      minRegionSize: 10,
    });
  });

  it('should display current detail level value', () => {
    render(<DetailControls />);
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('should disable controls when pipeline is running', () => {
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: StoreSelector) => {
      const state = {
        settings: {
          detailLevel: 50,
          minRegionSize: 135,
          paletteSize: 12,
          algorithm: 'kmeans',
          simplificationEpsilon: 1.5,
          presetPaletteId: null,
          customPalette: null,
          brightness: 0,
          contrast: 0,
          saturation: 0,
          borderWidth: 0,
          smoothingPasses: 0,
          preserveCorners: false,
        },
        pipeline: {
          status: 'running',
          currentStage: 'quantize',
          stageProgress: 50,
          error: null,
        },
        updateSettings: mockUpdateSettings,
      };
      return selector(state);
    });

    render(<DetailControls />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('disabled');
    });
  });
});
