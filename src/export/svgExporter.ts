import type { PipelineResult } from '../state/types';
import { rgbToHex } from '../algorithms/colorUtils';

function polygonToPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  const parts = [`M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`];
  for (let i = 1; i < points.length; i++) {
    parts.push(`L${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

export function generateSvg(result: PipelineResult, includeColor: boolean = false): string {
  const { width, height, contours, labels, palette } = result;

  const legendHeight = palette.length * 25 + 40;
  const totalHeight = height + legendHeight;

  const lines: string[] = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${totalHeight}" width="${width}" height="${totalHeight}">`);

  // White background
  lines.push(`  <rect width="100%" height="100%" fill="white"/>`);

  // Region outlines
  lines.push(`  <g id="regions" stroke="black" stroke-width="0.5" stroke-linejoin="round">`);
  for (const c of contours) {
    const fill = includeColor
      ? `rgb(${palette[c.colorIndex][0]},${palette[c.colorIndex][1]},${palette[c.colorIndex][2]})`
      : 'white';

    let d = polygonToPath(c.outerRing);
    for (const hole of c.holes) {
      d += ' ' + polygonToPath(hole);
    }
    lines.push(`    <path d="${d}" fill="${fill}" fill-rule="evenodd"/>`);
  }
  lines.push(`  </g>`);

  // Number labels
  lines.push(`  <g id="labels" font-family="Arial,Helvetica,sans-serif" fill="black" text-anchor="middle" dominant-baseline="central">`);
  for (const label of labels) {
    const fontSize = Math.max(5, Math.min(label.maxInscribedRadius * 0.8, 14));
    // Display 1-based color numbers
    const num = label.colorIndex + 1;
    lines.push(`    <text x="${label.x.toFixed(1)}" y="${label.y.toFixed(1)}" font-size="${fontSize.toFixed(1)}">${num}</text>`);
  }
  lines.push(`  </g>`);

  // Color legend below the image
  lines.push(`  <g id="legend" transform="translate(0,${height + 10})">`);
  lines.push(`    <text x="10" y="15" font-size="14" font-weight="bold" font-family="Arial,Helvetica,sans-serif">Color Legend</text>`);
  for (let i = 0; i < palette.length; i++) {
    const [r, g, b] = palette[i];
    const hex = rgbToHex(r, g, b);
    const yOff = 30 + i * 25;
    lines.push(`    <rect x="10" y="${yOff}" width="20" height="20" fill="rgb(${r},${g},${b})" stroke="black" stroke-width="0.5"/>`);
    lines.push(`    <text x="40" y="${yOff + 14}" font-size="12" font-family="Arial,Helvetica,sans-serif" dominant-baseline="auto">${i + 1} - ${hex}</text>`);
  }
  lines.push(`  </g>`);

  lines.push(`</svg>`);
  return lines.join('\n');
}

export function downloadSvg(svgContent: string, filename: string = 'paint-by-numbers.svg') {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
