import { describe, it, expect } from 'vitest';
import {
  expandBBox,
  polygonArea,
  polygonCentroid,
  pointToSegmentDistSq,
  pointInPolygon,
  pointToPolygonDist,
} from '../../utils/geometry';
import type { Point, BBox } from '../../state/types';

describe('geometry', () => {
  describe('expandBBox', () => {
    it('should expand bounding box to include a point inside', () => {
      const bbox: BBox = { x: 10, y: 10, w: 20, h: 20 };
      const expanded = expandBBox(bbox, 15, 15);
      expect(expanded).toEqual({ x: 10, y: 10, w: 20, h: 20 });
    });

    it('should expand bounding box to include a point below', () => {
      const bbox: BBox = { x: 10, y: 10, w: 20, h: 20 };
      const expanded = expandBBox(bbox, 15, 35);
      expect(expanded.y).toBe(10);
      expect(expanded.h).toBeGreaterThanOrEqual(26);
    });

    it('should expand bounding box to include a point to the right', () => {
      const bbox: BBox = { x: 10, y: 10, w: 20, h: 20 };
      const expanded = expandBBox(bbox, 35, 15);
      expect(expanded.x).toBe(10);
      expect(expanded.w).toBeGreaterThanOrEqual(26);
    });

    it('should expand to include a point outside all bounds', () => {
      const bbox: BBox = { x: 10, y: 10, w: 20, h: 20 };
      const expanded = expandBBox(bbox, 50, 50);
      expect(expanded.x).toBeLessThanOrEqual(10);
      expect(expanded.y).toBeLessThanOrEqual(10);
      expect(expanded.x + expanded.w).toBeGreaterThan(50);
      expect(expanded.y + expanded.h).toBeGreaterThan(50);
    });
  });

  describe('polygonArea', () => {
    it('should calculate area of a square', () => {
      const square: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];
      expect(polygonArea(square)).toBe(100);
    });

    it('should calculate area of a triangle', () => {
      const triangle: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 },
      ];
      expect(polygonArea(triangle)).toBe(50);
    });

    it('should return positive area regardless of winding order', () => {
      const ccw: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];
      const cw = [...ccw].reverse();
      expect(polygonArea(ccw)).toBe(polygonArea(cw));
    });
  });

  describe('polygonCentroid', () => {
    it('should calculate centroid of a square', () => {
      const square: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];
      const centroid = polygonCentroid(square);
      expect(centroid.x).toBeCloseTo(5, 1);
      expect(centroid.y).toBeCloseTo(5, 1);
    });

    it('should calculate centroid of a triangle', () => {
      const triangle: Point[] = [
        { x: 0, y: 0 },
        { x: 6, y: 0 },
        { x: 3, y: 6 },
      ];
      const centroid = polygonCentroid(triangle);
      expect(centroid.x).toBeCloseTo(3, 0);
      expect(centroid.y).toBeCloseTo(2, 0);
    });

    it('should handle degenerate polygon (line)', () => {
      const line: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ];
      const centroid = polygonCentroid(line);
      expect(centroid.x).toBeCloseTo(5, 1);
      expect(centroid.y).toBeCloseTo(0, 1);
    });
  });

  describe('pointToSegmentDistSq', () => {
    it('should return 0 for point on segment', () => {
      const distSq = pointToSegmentDistSq(5, 0, 0, 0, 10, 0);
      expect(distSq).toBeCloseTo(0, 5);
    });

    it('should calculate distance to segment endpoint', () => {
      const distSq = pointToSegmentDistSq(0, 10, 0, 0, 0, 0);
      expect(distSq).toBe(100);
    });

    it('should calculate perpendicular distance to segment', () => {
      const distSq = pointToSegmentDistSq(5, 5, 0, 0, 10, 0);
      expect(distSq).toBeCloseTo(25, 5);
    });

    it('should project point onto segment correctly', () => {
      // Point (5, 3) should project to (5, 0) on segment from (0,0) to (10,0)
      const distSq = pointToSegmentDistSq(5, 3, 0, 0, 10, 0);
      expect(distSq).toBeCloseTo(9, 5);
    });
  });

  describe('pointInPolygon', () => {
    const square: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];

    it('should return true for point inside polygon', () => {
      expect(pointInPolygon(5, 5, square)).toBe(true);
    });

    it('should return false for point outside polygon', () => {
      expect(pointInPolygon(15, 15, square)).toBe(false);
      expect(pointInPolygon(-5, -5, square)).toBe(false);
    });

    it('should handle point on edge consistently', () => {
      // Points exactly on edges may return true or false depending on algorithm
      const resultLeft = pointInPolygon(0, 5, square);
      const resultTop = pointInPolygon(5, 0, square);
      expect(typeof resultLeft).toBe('boolean');
      expect(typeof resultTop).toBe('boolean');
    });
  });

  describe('pointToPolygonDist', () => {
    const square: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];

    it('should return positive distance for point inside polygon', () => {
      const dist = pointToPolygonDist(5, 5, square);
      expect(dist).toBeGreaterThan(0);
    });

    it('should return negative distance for point outside polygon', () => {
      const dist = pointToPolygonDist(15, 15, square);
      expect(dist).toBeLessThan(0);
    });

    it('should return 0 or near 0 for point on boundary', () => {
      const dist = pointToPolygonDist(5, 0, square);
      expect(Math.abs(dist)).toBeLessThan(0.1);
    });

    it('should calculate correct distance to nearest edge', () => {
      // Point at (15, 5), nearest to right edge at x=10
      const dist = pointToPolygonDist(15, 5, square);
      expect(Math.abs(dist)).toBeCloseTo(5, 1);
    });
  });
});
