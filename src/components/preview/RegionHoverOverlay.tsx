import { useRef, useCallback } from 'react';
import { useAppStore } from '../../state/appStore';

export function RegionHoverOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const result = useAppStore((s) => s.result);
  const zoom = useAppStore((s) => s.ui.zoom);
  const panX = useAppStore((s) => s.ui.panX);
  const panY = useAppStore((s) => s.ui.panY);
  const setHoveredRegion = useAppStore((s) => s.setHoveredRegion);

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

  if (!result) return null;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    />
  );
}
