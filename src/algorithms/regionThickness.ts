/**
 * Region thickness via a chamfer distance transform.
 *
 * A region's "thickness" is the width of the widest brush stroke that fits inside it —
 * twice the largest inscribed circle radius. This is what makes a region paintable, and
 * unlike a bounding box it is orientation-independent: a diagonal sliver and a thin arm
 * on an L-shaped region are both caught, while a bbox test lets them through.
 */

/** Chamfer 3-4 weights. Dividing by ORTHO recovers Euclidean distance to ~8%. */
const ORTHO = 3;
const DIAG = 4;
const INF = 0x3fffffff;

/**
 * Distance from every pixel to the nearest pixel of a *different* region, in chamfer
 * units (divide by 3 for pixels). Border pixels are 0.
 *
 * The image edge counts as a region boundary: a 2px strip hugging the top of the canvas
 * is just as unpaintable as one in the middle, and the painter really does have to cut
 * in against that edge.
 */
export function computeInnerDistance(
  labelMap: Int32Array,
  width: number,
  height: number
): Int32Array {
  const dist = new Int32Array(width * height);

  // Seed: 0 on boundary pixels, INF everywhere else.
  let idx = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++, idx++) {
      const label = labelMap[idx];
      // Edge tests come first so the neighbour reads below are always in bounds.
      const isBoundary =
        x === 0 ||
        y === 0 ||
        x === width - 1 ||
        y === height - 1 ||
        labelMap[idx - 1] !== label ||
        labelMap[idx + 1] !== label ||
        labelMap[idx - width] !== label ||
        labelMap[idx + width] !== label;
      dist[idx] = isBoundary ? 0 : INF;
    }
  }

  // Forward pass: top-left to bottom-right. Only interior pixels can still be INF,
  // so y/x are strictly inside the image and every neighbour read is in bounds.
  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    for (let x = 1; x < width - 1; x++) {
      const i = row + x;
      let d = dist[i];
      if (d === 0) continue;
      const up = i - width;
      let c = dist[up - 1] + DIAG; if (c < d) d = c;
      c = dist[up] + ORTHO;        if (c < d) d = c;
      c = dist[up + 1] + DIAG;     if (c < d) d = c;
      c = dist[i - 1] + ORTHO;     if (c < d) d = c;
      dist[i] = d;
    }
  }

  // Backward pass: bottom-right to top-left.
  for (let y = height - 2; y >= 1; y--) {
    const row = y * width;
    for (let x = width - 2; x >= 1; x--) {
      const i = row + x;
      let d = dist[i];
      if (d === 0) continue;
      const down = i + width;
      let c = dist[down + 1] + DIAG; if (c < d) d = c;
      c = dist[down] + ORTHO;        if (c < d) d = c;
      c = dist[down - 1] + DIAG;     if (c < d) d = c;
      c = dist[i + 1] + ORTHO;       if (c < d) d = c;
      dist[i] = d;
    }
  }

  return dist;
}

/**
 * Thickness in pixels for every label present in `labelMap`, indexed by label id.
 * Labels not present read back as 0.
 *
 * A 1px-wide line is all boundary, so its max inner distance is 0 and thickness is 1;
 * a 3px strip has a centre pixel one step in, giving thickness 3.
 */
export function computeRegionThickness(
  labelMap: Int32Array,
  width: number,
  height: number,
  maxLabel: number
): Float32Array {
  const dist = computeInnerDistance(labelMap, width, height);

  const maxDist = new Int32Array(maxLabel + 1).fill(-1);
  for (let i = 0; i < labelMap.length; i++) {
    const label = labelMap[i];
    if (dist[i] > maxDist[label]) maxDist[label] = dist[i];
  }

  const thickness = new Float32Array(maxLabel + 1);
  for (let id = 0; id <= maxLabel; id++) {
    if (maxDist[id] < 0) continue; // label absent from the map
    thickness[id] = (2 * maxDist[id]) / ORTHO + 1;
  }
  return thickness;
}
