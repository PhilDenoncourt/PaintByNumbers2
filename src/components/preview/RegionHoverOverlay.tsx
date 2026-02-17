import { useRef, useCallback } from 'react';
import { useAppStore } from '../../state/appStore';

export function RegionHoverOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const result = useAppStore((s) => s.result);
  const zoom = useAppStore((s) => s.ui.zoom);
  const panX = useAppStore((s) => s.ui.panX);
  const panY = useAppStore((s) => s.ui.panY);
  const setHoveredRegion = useAppStore((s) => s.setHoveredRegion);
  const changeRegionColor = useAppStore((s) => s.changeRegionColor);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!result || !overlayRef.current) return;

      const rect = overlayRef.current.getBoundingClientRect();
      // Map screen coords back to image coords
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
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
      if (!colorIndexStr || !result || !overlayRef.current) return;

      e.preventDefault();
      const newColorIndex = parseInt(colorIndexStr, 10);

      // Map drop location back to image coords
      const rect = overlayRef.current.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
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

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    />
  );
}
