import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useAppStore } from '../../../state/appStore';
import { AppShell } from '../../../components/layout/AppShell';

const savedProject = vi.hoisted(() => ({ metadata: null as null | { updatedAt: number; thumbnail: string } }));

vi.mock('../../../components/ads/HomeAd', () => ({ HomeAd: () => <aside aria-label="Home ad" /> }));
vi.mock('../../../components/studio/StudioHeader', () => ({ StudioHeader: () => null }));
vi.mock('../../../components/studio/StudioControls', () => ({ StudioControls: () => <div>Creator controls</div> }));
vi.mock('../../../components/studio/StudioCanvasCard', () => ({ StudioCanvasCard: () => null }));
vi.mock('../../../components/preview/PreprocessedImagePreview', () => ({ PreprocessedImagePreview: () => null }));
vi.mock('../../../components/projects/ProjectSaveStatus', () => ({ ProjectSaveStatus: () => null }));
vi.mock('../../../projects/projectPersistence', () => ({
  projectPersistence: { initialize: vi.fn(), resume: vi.fn().mockResolvedValue(undefined), importFile: vi.fn().mockResolvedValue(undefined) },
  useProjectPersistence: () => ({ metadata: savedProject.metadata, status: 'idle' }),
}));

const initialState = useAppStore.getState();
beforeEach(() => {
  savedProject.metadata = null;
  useAppStore.setState({ ...initialState, loadImage: vi.fn().mockResolvedValue(undefined) }, true);
});
afterEach(() => { cleanup(); useAppStore.setState(initialState, true); });

describe('home-page ad boundary', () => {
  it('removes ads before resuming a saved project', async () => {
    savedProject.metadata = { updatedAt: Date.now(), thumbnail: '' };
    render(<AppShell />);
    expect(screen.getByRole('complementary', { name: 'Home ad' })).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Resume' })); });
    expect(screen.queryByRole('complementary', { name: 'Home ad' })).not.toBeInTheDocument();
  });

  it('removes ads when browsing for a file, even if the picker is cancelled', () => {
    render(<AppShell />);
    expect(screen.getByRole('complementary', { name: 'Home ad' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('uploader.dragDrop'));
    expect(screen.queryByRole('complementary', { name: 'Home ad' })).not.toBeInTheDocument();
  });

  it.each(['image/png', 'application/json'])('removes ads before loading a dropped %s file', async (type) => {
    render(<AppShell />);
    const file = new File(['test'], type === 'image/png' ? 'photo.png' : 'project.json', { type });
    await act(async () => {
      fireEvent.drop(screen.getByText('uploader.dragDrop'), { dataTransfer: { files: [file] } });
    });
    expect(screen.queryByRole('complementary', { name: 'Home ad' })).not.toBeInTheDocument();
  });

  it('removes ads before loading a pasted image', async () => {
    render(<AppShell />);
    await act(async () => {
      fireEvent.paste(screen.getByText('uploader.dragDrop'), {
        clipboardData: { items: [{ type: 'image/png', getAsFile: () => new File(['test'], 'photo.png', { type: 'image/png' }) }] },
      });
    });
    expect(screen.queryByRole('complementary', { name: 'Home ad' })).not.toBeInTheDocument();
  });

  it.each(['idle', 'running', 'complete', 'error'] as const)('never mounts ads in the creator with pipeline status %s', (status) => {
    useAppStore.setState({ sourceImageData: { width: 1, height: 1, data: new Uint8ClampedArray(4), colorSpace: 'srgb' }, pipeline: { ...initialState.pipeline, status } });
    render(<AppShell />);
    expect(screen.getByText('Creator controls')).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Home ad' })).not.toBeInTheDocument();
  });
});
