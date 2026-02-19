/**
 * Unified palette registry — maps palette IDs to color lists and vendor info.
 *
 * Adding affiliate revenue
 * ─────────────────────────
 * All `vendorUrl` values point to real product pages or Amazon search results.
 * To earn Amazon Associates commissions, append your affiliate tag to each URL:
 *
 *   https://www.amazon.com/s?k=prismacolor+premier+72&tag=YOUR-TAG-20
 *
 * You can also use Blick Art Materials (blickart.com), Michaels, or other
 * programs — replace the URLs accordingly.
 */

import { crayolaPalettes } from './crayolaPalettes';
import { prismacolor72, prismacolor150extras } from './prismacolorPalettes';
import { cotman24, cotman45extras } from './winsornewtonPalettes';
import { tombow96 } from './tombowPalettes';

// ── Shared types ──────────────────────────────────────────────────────────────

export interface PresetColor {
  name: string;
  rgb: [number, number, number];
  code?: string;
}

export interface PresetPalette {
  id: string;
  label: string;
  brand: string;
  medium: string;        // e.g. 'Crayon', 'Colored Pencil', 'Watercolor', 'Marker'
  vendorUrl: string;     // link to the product — add your affiliate tag here
  size: number;
  colors: PresetColor[];
}

// ── Crayola ───────────────────────────────────────────────────────────────────
//
// One dedicated Amazon product link per box size.
// These point to the standard retail packs; append &tag=YOUR-TAG-20 for affiliate credit.

const crayolaVendorUrls: Record<number, string> = {
  8:   'https://amzn.to/4tPK7hY', // Crayola Crayons, 8 Count
  16:  'https://amzn.to/46apq68', // Crayola Crayons, 16 Count
  24:  'https://amzn.to/4tKDzku', // Crayola Crayons, 24 Count
  48:  'https://amzn.to/4bXDeoa', // Crayola Crayons, 48 Count
  64:  'https://amzn.to/4aDEFWr', // Crayola Crayons, 64 Count
  96:  'https://amzn.to/3OOStpI', // Crayola Crayons, 96 Count
  120: 'https://amzn.to/3OOStpI', // Crayola Crayons, 120 Count
};

const crayolaPresets: PresetPalette[] = crayolaPalettes.map((p) => ({
  id: `crayola-${p.size}`,
  label: p.label,
  brand: 'Crayola',
  medium: 'Crayon',
  vendorUrl: crayolaVendorUrls[p.size] ?? `https://www.amazon.com/s?k=crayola+crayons+${p.size}+count`,
  size: p.size,
  colors: p.colors.map((c) => ({ name: c.name, rgb: c.rgb })),
}));

// ── Prismacolor Premier ────────────────────────────────────────────────────────

function dedup(colors: { code: string; name: string; rgb: [number, number, number] }[]): PresetColor[] {
  const seen = new Set<string>();
  const result: PresetColor[] = [];
  for (const c of colors) {
    const key = c.rgb.join(',');
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ code: c.code, name: c.name, rgb: c.rgb });
    }
  }
  return result;
}

const prismacolorPresets: PresetPalette[] = [
  {
    id: 'prismacolor-72',
    label: 'Prismacolor Premier 72',
    brand: 'Prismacolor',
    medium: 'Colored Pencil',
    vendorUrl: 'https://amzn.to/4tITP5z',
    size: prismacolor72.length,
    colors: dedup(prismacolor72),
  },
  {
    id: 'prismacolor-150',
    label: 'Prismacolor Premier 150',
    brand: 'Prismacolor',
    medium: 'Colored Pencil',
    vendorUrl: 'https://amzn.to/4s5qLnj',
    size: prismacolor72.length + prismacolor150extras.length,
    colors: dedup([...prismacolor72, ...prismacolor150extras]),
  },
];

// ── Winsor & Newton Cotman ────────────────────────────────────────────────────

const winsornewtonPresets: PresetPalette[] = [
  {
    id: 'cotman-24',
    label: "Winsor & Newton Cotman 24-pan",
    brand: 'Winsor & Newton',
    medium: 'Watercolor',
    vendorUrl: "https://amzn.to/3Oqr8dp",
    size: cotman24.length,
    colors: dedup(cotman24),
  },
  {
    id: 'cotman-45',
    label: "Winsor & Newton Cotman 45-pan",
    brand: 'Winsor & Newton',
    medium: 'Watercolor',
    vendorUrl: "https://amzn.to/3OmL017",
    size: cotman24.length + cotman45extras.length,
    colors: dedup([...cotman24, ...cotman45extras]),
  },
];

// ── Tombow Dual Brush ─────────────────────────────────────────────────────────

const tombowPresets: PresetPalette[] = [
  {
    id: 'tombow-96',
    label: 'Tombow Dual Brush 96-Pack',
    brand: 'Tombow',
    medium: 'Marker',
    vendorUrl: 'https://amzn.to/3Ol1R4t',
    size: tombow96.length,
    colors: dedup(tombow96),
  },
];

// ── Registry ──────────────────────────────────────────────────────────────────

export const allPresetPalettes: PresetPalette[] = [
  ...crayolaPresets,
  ...prismacolorPresets,
  ...winsornewtonPresets,
  ...tombowPresets,
];

/** Find a palette by its unique ID (e.g. 'crayola-8', 'prismacolor-72'). */
export function findPresetPalette(id: string): PresetPalette | undefined {
  return allPresetPalettes.find((p) => p.id === id);
}

/** All distinct brand names, in display order. */
export const presetBrands = [...new Set(allPresetPalettes.map((p) => p.brand))];

/** All palettes for a given brand. */
export function palettesForBrand(brand: string): PresetPalette[] {
  return allPresetPalettes.filter((p) => p.brand === brand);
}
