import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StudioControls } from '../../../components/studio/StudioControls';
import { useAppStore } from '../../../state/appStore';

describe('Studio automatic palette controls', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
    useAppStore.setState({ autoRegenerate: false });
  });

  it('lets the user choose 100 colors and switch algorithms, preserving choices across palette modes', () => {
    render(<StudioControls />);
    expect(screen.queryByRole('combobox', { name: 'controls.algorithm' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'panels.palette.autoDetect' }));
    const slider = screen.getByRole('slider', { name: 'controls.paletteSize' });
    expect(slider).toHaveAttribute('min', '3');
    expect(slider).toHaveAttribute('max', '100');
    fireEvent.change(slider, { target: { value: '100' } });
    expect(useAppStore.getState().settings.paletteSize).toBe(100);

    const algorithm = screen.getByRole('combobox', { name: 'controls.algorithm' });
    expect(algorithm).toHaveValue('kmeans');
    expect(algorithm).toHaveAccessibleDescription('controls.kmeansHelp');
    fireEvent.change(algorithm, { target: { value: 'mediancut' } });
    expect(useAppStore.getState().settings.algorithm).toBe('mediancut');
    expect(algorithm).toHaveAccessibleDescription('controls.mediancutHelp');

    fireEvent.click(screen.getByRole('button', { name: 'panels.palette.custom' }));
    expect(screen.queryByRole('combobox', { name: 'controls.algorithm' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'panels.palette.fromSet' }));
    expect(screen.queryByRole('slider', { name: 'controls.paletteSize' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'panels.palette.autoDetect' }));
    expect(screen.getByRole('slider', { name: 'controls.paletteSize' })).toHaveValue('100');
    expect(screen.getByRole('combobox', { name: 'controls.algorithm' })).toHaveValue('mediancut');
  });

  it('disables automatic palette settings during generation', () => {
    useAppStore.getState().updateSettings({ presetPaletteId: null });
    useAppStore.setState({ pipeline: { status: 'running', currentStage: 'quantize', stageProgress: 0, error: null } });
    render(<StudioControls />);
    expect(screen.getByRole('slider', { name: 'controls.paletteSize' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'controls.algorithm' })).toBeDisabled();
  });
});
