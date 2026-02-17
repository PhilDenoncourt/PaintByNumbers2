import { useRef, useCallback, type ReactNode } from 'react';
import { useAppStore } from '../../state/appStore';

interface Props {
  children: ReactNode;
}

export function ZoomPanContainer({ children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const zoom = useAppStore((s) => s.ui.zoom);
  const panX = useAppStore((s) => s.ui.panX);
  const panY = useAppStore((s) => s.ui.panY);
  const setZoomPan = useAppStore((s) => s.setZoomPan);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(10, zoom * delta));
      setZoomPan(newZoom, panX, panY);
    },
    [zoom, panX, panY, setZoomPan]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      isPanning.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    },
    []
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning.current) return;
      const dx = (e.clientX - lastPos.current.x) / zoom;
      const dy = (e.clientY - lastPos.current.y) / zoom;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setZoomPan(zoom, panX + dx, panY + dy);
    },
    [zoom, panX, panY, setZoomPan]
  );

  const onMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden w-full h-full cursor-grab active:cursor-grabbing bg-gray-100 rounded-lg"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {children}
    </div>
  );
}
