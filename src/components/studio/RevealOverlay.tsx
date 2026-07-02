import { useEffect, useMemo } from 'react';
import type { PipelineResult, ContourData } from '../../state/types';
import { rgbCss } from './studioColor';
import type { StudioTokens } from './studioTokens';

function ringPath(ring: { x: number; y: number }[]): string {
  if (ring.length < 2) return '';
  let d = `M${ring[0].x.toFixed(1)},${ring[0].y.toFixed(1)}`;
  for (let i = 1; i < ring.length; i++) d += `L${ring[i].x.toFixed(1)},${ring[i].y.toFixed(1)}`;
  return d + 'Z';
}

function contourPath(c: ContourData): string {
  let d = ringPath(c.outerRing);
  for (const hole of c.holes) d += ringPath(hole);
  return d;
}

/**
 * The signature "paint-in" reveal (handoff §The reveal). Renders the finished
 * artwork as a colored base, then an "unpainted template" overlay (mat fill +
 * region numbers) that fades region-by-region in back-to-front paint order,
 * making each region's color appear as its number disappears.
 *
 * Built from the real `result.contours`/`labels`. It plays at the default view
 * and unmounts when done so the interactive canvas underneath takes over.
 * Skipped entirely under `prefers-reduced-motion`.
 */
export function RevealOverlay({
  result,
  tokens,
  runId,
  onDone,
}: {
  result: PipelineResult;
  tokens: StudioTokens;
  runId: number;
  onDone?: () => void;
}) {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const { width, height, palette, contours, labels } = result;

  const { ordered, labelByRegion, timing } = useMemo(() => {
    const bboxById = new Map(result.regions.map((r) => [r.id, r.boundingBox]));
    // Back-to-front paint order: top of the image (sky) first, foreground last.
    const ordered = [...contours].sort((a, b) => {
      const ba = bboxById.get(a.regionId);
      const bb = bboxById.get(b.regionId);
      return (ba?.y ?? 0) - (bb?.y ?? 0) || (ba?.x ?? 0) - (bb?.x ?? 0);
    });
    const labelByRegion = new Map(labels.map((l) => [l.regionId, l]));
    // Scale the stagger so the whole reveal lands at ~2.6s regardless of count.
    const count = Math.max(1, ordered.length);
    const base = 0.2;
    const dur = count > 60 ? 0.4 : 0.55;
    const stagger = Math.min(0.18, Math.max(0.008, 2.4 / count));
    return { ordered, labelByRegion, timing: { base, dur, stagger, total: base + count * stagger + dur } };
  }, [contours, labels, result.regions]);

  useEffect(() => {
    if (reduced) {
      return;
    }
    const id = window.setTimeout(() => {
      onDone?.();
    }, timing.total * 1000 + 150);
    return () => window.clearTimeout(id);
    // Re-run whenever Replay bumps runId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, reduced]);

  if (reduced) return null;

  return (
    <svg
      data-pbn-reveal
      key={runId}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5 }}
      aria-hidden="true"
    >
      {/* Colored base — the finished artwork. */}
      <g>
        {ordered.map((c) => (
          <path
            key={`b${c.regionId}`}
            d={contourPath(c)}
            fill={rgbCss(palette[c.colorIndex])}
            stroke={tokens.revealSep}
            strokeWidth={1}
            strokeLinejoin="round"
            fillRule="evenodd"
          />
        ))}
      </g>
      {/* Unpainted template overlay — fades region-by-region to reveal color. */}
      <g>
        {ordered.map((c, i) => {
          const label = labelByRegion.get(c.regionId);
          const fontSize = label ? Math.max(5, Math.min(label.maxInscribedRadius * 0.8, 14)) : 9;
          return (
            <g
              key={`o${c.regionId}`}
              style={{
                animation: `pbnFade ${timing.dur}s ease forwards`,
                animationDelay: `${(timing.base + i * timing.stagger).toFixed(3)}s`,
              }}
            >
              <path
                d={contourPath(c)}
                fill={tokens.revealMat}
                stroke={tokens.revealStroke}
                strokeWidth={1}
                strokeLinejoin="round"
                fillRule="evenodd"
              />
              {label && (
                <text
                  x={label.x}
                  y={label.y}
                  fontSize={fontSize}
                  fontFamily="'Spectral', serif"
                  fontWeight={600}
                  fill={tokens.revealNum}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {c.colorIndex + 1}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
