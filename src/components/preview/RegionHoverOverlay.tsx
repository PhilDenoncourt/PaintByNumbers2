import { useRef, useCallback, useLayoutEffect } from 'react';
import { useAppStore } from '../../state/appStore';

export function RegionHoverOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const result = useAppStore((s) => s.result);
  const zoom = useAppStore((s) => s.ui.zoom);
  const panX = useAppStore((s) => s.ui.panX);
  const panY = useAppStore((s) => s.ui.panY);
  const setHoveredRegion = useAppStore((s) => s.setHoveredRegion);
  const changeRegionColor = useAppStore((s) => s.changeRegionColor);
  const mergeMode = useAppStore((s) => s.ui.mergeMode);
  const toggleRegionSelection = useAppStore((s) => s.toggleRegionSelection);
  const suggestMergeTargets = useAppStore((s) => s.suggestMergeTargets);
  const analyzeSplitCandidates = useAppStore((s) => s.analyzeSplitCandidates);
  const selectedRegions = useAppStore((s) => s.ui.selectedRegions);

  // Find canvas element - it's a sibling within the parent container
  useLayoutEffect(() => {
    if (!overlayRef.current) return;
    const container = overlayRef.current.parentElement;
    const canvas = container?.querySelector('canvas');
    if (canvas instanceof HTMLCanvasElement) {
      canvasRef.current = canvas;
    }
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!result || !canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      // Map screen coords back to image coords
      // Use the canvas's actual position, accounting for its centering in the container
      const screenX = e.clientX - canvasRect.left;
      const screenY = e.clientY - canvasRect.top;
      const imgX = Math.floor(screenX / zoom - panX);
      const imgY = Math.floor(screenY / zoom - panY);

      if (imgX < 0 || imgY < 0 || imgX >= result.width || imgY >= result.height) {
        setHoveredRegion(null);
        return;
      }

      const label = result.labelMap[imgY * result.width + imgX];
      setHoveredRegion(label);
    },
    [result, zoom, panX, panY, setHoveredRegion]
  );

  const onClick = useCallback(
    async (e: React.MouseEvent) => {
      if (!result || !canvasRef.current) return;
      if (mergeMode === 'browse') return; // No action in browse mode

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const screenX = e.clientX - canvasRect.left;
      const screenY = e.clientY - canvasRect.top;
      const imgX = Math.floor(screenX / zoom - panX);
      const imgY = Math.floor(screenY / zoom - panY);

      if (imgX < 0 || imgY < 0 || imgX >= result.width || imgY >= result.height) {
        return;
      }

      const regionId = result.labelMap[imgY * result.width + imgX];

      if (mergeMode === 'merge') {
        // Toggle selection
        toggleRegionSelection(regionId);

        // If this is the first selection, suggest merge targets
        if (selectedRegions.length === 0) {
          await suggestMergeTargets(regionId);
        }
      } else if (mergeMode === 'split') {
        // Analyze region for split candidates
        await analyzeSplitCandidates(regionId);
      }
    },
    [result, zoom, panX, panY, mergeMode, selectedRegions, toggleRegionSelection, suggestMergeTargets, analyzeSplitCandidates]
  );

  const onMouseLeave = useCallback(() => {
    setHoveredRegion(null);
  }, [setHoveredRegion]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-color-index')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      const colorIndexStr = e.dataTransfer.getData('application/x-color-index');
      if (!colorIndexStr || !result || !canvasRef.current) return;

      e.preventDefault();
      const newColorIndex = parseInt(colorIndexStr, 10);

      // Map drop location back to image coords
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const screenX = e.clientX - canvasRect.left;
      const screenY = e.clientY - canvasRect.top;
      const imgX = Math.floor(screenX / zoom - panX);
      const imgY = Math.floor(screenY / zoom - panY);

      if (imgX < 0 || imgY < 0 || imgX >= result.width || imgY >= result.height) {
        return;
      }

      const regionId = result.labelMap[imgY * result.width + imgX];
      if (regionId !== undefined && regionId >= 0) {
        changeRegionColor(regionId, newColorIndex);
      }
    },
    [result, zoom, panX, panY, changeRegionColor]
  );

  if (!result) return null;

  const cursorStyle: React.CSSProperties = {
    cursor:
      mergeMode === 'merge'
        ? 'crosshair'
        : mergeMode === 'split'
          ? 'cell'
          : 'auto',
  };

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0"
      style={cursorStyle}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
    />
  );
}
