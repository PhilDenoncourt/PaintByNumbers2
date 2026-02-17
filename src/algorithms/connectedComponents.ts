import type { RegionInfo } from '../state/types';

class UnionFind {
  parent: Int32Array;
  rank: Uint8Array;

  constructor(n: number) {
    this.parent = new Int32Array(n);
    this.rank = new Uint8Array(n);
    for (let i = 0; i < n; i++) this.parent[i] = i;
  }

  find(x: number): number {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]]; // path halving
      x = this.parent[x];
    }
    return x;
  }

  union(a: number, b: number): void {
    let rootA = this.find(a);
    let rootB = this.find(b);
    if (rootA === rootB) return;
    if (this.rank[rootA] < this.rank[rootB]) {
      const tmp = rootA; rootA = rootB; rootB = tmp;
    }
    this.parent[rootB] = rootA;
    if (this.rank[rootA] === this.rank[rootB]) this.rank[rootA]++;
  }
}

export function connectedComponents(
  indexMap: Uint8Array,
  width: number,
  height: number,
  onProgress?: (percent: number) => void
): { labelMap: Int32Array; regions: RegionInfo[] } {
  const totalPixels = width * height;
  const labelMap = new Int32Array(totalPixels);
  const uf = new UnionFind(totalPixels + 1); // labels start at 1
  let nextLabel = 1;

  // Pass 1: assign provisional labels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const myColor = indexMap[idx];

      const hasLeft = x > 0 && indexMap[idx - 1] === myColor;
      const hasUp = y > 0 && indexMap[idx - width] === myColor;

      if (!hasLeft && !hasUp) {
        labelMap[idx] = nextLabel++;
      } else if (hasLeft && !hasUp) {
        labelMap[idx] = labelMap[idx - 1];
      } else if (!hasLeft && hasUp) {
        labelMap[idx] = labelMap[idx - width];
      } else {
        const leftLabel = labelMap[idx - 1];
        const upLabel = labelMap[idx - width];
        labelMap[idx] = Math.min(leftLabel, upLabel);
        if (leftLabel !== upLabel) {
          uf.union(leftLabel, upLabel);
        }
      }
    }
    if (y % 100 === 0) onProgress?.(Math.round((y / height) * 50));
  }

  // Pass 2: resolve labels and collect region info
  const regionMap = new Map<number, RegionInfo>();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const root = uf.find(labelMap[idx]);
      labelMap[idx] = root;

      let region = regionMap.get(root);
      if (!region) {
        region = {
          id: root,
          colorIndex: indexMap[idx],
          pixelCount: 0,
          boundingBox: { x, y, w: 1, h: 1 },
        };
        regionMap.set(root, region);
      }
      region.pixelCount++;

      // Expand bounding box
      const bb = region.boundingBox;
      const minX = Math.min(bb.x, x);
      const minY = Math.min(bb.y, y);
      const maxX = Math.max(bb.x + bb.w - 1, x);
      const maxY = Math.max(bb.y + bb.h - 1, y);
      bb.x = minX;
      bb.y = minY;
      bb.w = maxX - minX + 1;
      bb.h = maxY - minY + 1;
    }
    if (y % 100 === 0) onProgress?.(50 + Math.round((y / height) * 50));
  }

  onProgress?.(100);

  return { labelMap, regions: Array.from(regionMap.values()) };
}
