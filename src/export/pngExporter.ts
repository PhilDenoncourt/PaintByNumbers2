import type { PipelineResult } from '../state/types';
import { rgbToHex } from '../algorithms/colorUtils';
import { crayolaPalettes } from '../data/crayolaPalettes';

export function generatePngCanvas(
  result: PipelineResult,
  includeColor: boolean = false
): HTMLCanvasElement {
  const { width, height, contours, labels, palette } = result;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // Draw regions
  for (const contour of contours) {
    const [r, g, b] = palette[contour.colorIndex];

    // Fill region if colored
    if (includeColor) {
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      // Draw outer ring
      if (contour.outerRing.length > 0) {
        ctx.moveTo(contour.outerRing[0].x, contour.outerRing[0].y);
        for (let i = 1; i < contour.outerRing.length; i++) {
          ctx.lineTo(contour.outerRing[i].x, contour.outerRing[i].y);
        }
        ctx.closePath();
      }
      
      // Add holes to the same path for proper evenodd filling
      for (const hole of contour.holes) {
        if (hole.length > 0) {
          ctx.moveTo(hole[0].x, hole[0].y);
          for (let i = 1; i < hole.length; i++) {
            ctx.lineTo(hole[i].x, hole[i].y);
          }
          ctx.closePath();
        }
      }
      
      // Fill with evenodd rule to create proper holes
      ctx.fill('evenodd');
    }

    // Draw outline
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    if (contour.outerRing.length > 0) {
      ctx.moveTo(contour.outerRing[0].x, contour.outerRing[0].y);
      for (let i = 1; i < contour.outerRing.length; i++) {
        ctx.lineTo(contour.outerRing[i].x, contour.outerRing[i].y);
      }
      ctx.closePath();
    }
    ctx.stroke();

    // Draw hole outlines
    for (const hole of contour.holes) {
      ctx.beginPath();
      if (hole.length > 0) {
        ctx.moveTo(hole[0].x, hole[0].y);
        for (let i = 1; i < hole.length; i++) {
          ctx.lineTo(hole[i].x, hole[i].y);
        }
        ctx.closePath();
      }
      ctx.stroke();
    }
  }

  // Draw labels
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const label of labels) {
    const fontSize = Math.max(5, Math.min(label.maxInscribedRadius * 0.8, 14));
    ctx.font = `${fontSize}px Arial`;
    const num = label.colorIndex + 1;
    ctx.fillText(num.toString(), label.x, label.y);
  }

  return canvas;
}

export function downloadPng(
  result: PipelineResult,
  includeColor: boolean = false,
  filename: string = 'paint-by-numbers.png'
) {
  const canvas = generatePngCanvas(result, includeColor);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export function generateColorLegendPng(
  result: PipelineResult,
  presetPaletteId: string | null = null
): HTMLCanvasElement {
  const { palette } = result;

  const canvas = document.createElement('canvas');
  const cellWidth = 150;
  const cellHeight = 30;
  const columns = 2;
  const rows = Math.ceil(palette.length / columns);

  canvas.width = cellWidth * columns;
  canvas.height = cellHeight * (rows + 1);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = 'black';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Color Legend', 10, 25);

  // Resolve preset palette
  let presetColors: { name: string; rgb: [number, number, number] }[] | null = null;
  if (presetPaletteId) {
    const preset = crayolaPalettes.find(
      (p: any) => `crayola-${p.size}` === presetPaletteId
    );
    if (preset) presetColors = preset.colors;
  }

  // Draw color swatches
  ctx.font = '12px Arial';
  for (let i = 0; i < palette.length; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = col * cellWidth;
    const y = (row + 1) * cellHeight;

    const [r, g, b] = palette[i];

    // Color swatch
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x + 10, y + 5, 20, 20);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x + 10, y + 5, 20, 20);

    // Text
    let labelText: string;
    if (presetColors) {
      const match = presetColors.find(
        (c) => c.rgb[0] === r && c.rgb[1] === g && c.rgb[2] === b
      );
      labelText = match ? `${i + 1} - ${match.name}` : `${i + 1} - ${rgbToHex(r, g, b)}`;
    } else {
      labelText = `${i + 1} - ${rgbToHex(r, g, b)}`;
    }

    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.fillText(labelText, x + 35, y + 15);
  }

  return canvas;
}

export function downloadColorLegendPng(
  result: PipelineResult,
  presetPaletteId: string | null = null,
  filename: string = 'paint-by-numbers-legend.png'
) {
  const canvas = generateColorLegendPng(result, presetPaletteId);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
