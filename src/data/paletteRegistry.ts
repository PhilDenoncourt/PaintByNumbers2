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

const crayolaPresets: PresetPalette[] = crayolaPalettes.map((p) => ({
  id: `crayola-${p.size}`,
  label: p.label,
  brand: 'Crayola',
  medium: 'Crayon',
  vendorUrl: `https://www.amazon.com/s?k=crayola+crayons+${p.size}+count`,
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
    vendorUrl: 'https://www.amazon.com/s?k=prismacolor+premier+soft+core+72+colored+pencils',
    size: prismacolor72.length,
    colors: dedup(prismacolor72),
  },
  {
    id: 'prismacolor-150',
    label: 'Prismacolor Premier 150',
    brand: 'Prismacolor',
    medium: 'Colored Pencil',
    vendorUrl: 'https://www.amazon.com/s?k=prismacolor+premier+soft+core+150+colored+pencils',
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
    vendorUrl: "https://www.amazon.com/s?k=winsor+newton+cotman+24+pan+watercolor+set",
    size: cotman24.length,
    colors: dedup(cotman24),
  },
  {
    id: 'cotman-45',
    label: "Winsor & Newton Cotman 45-pan",
    brand: 'Winsor & Newton',
    medium: 'Watercolor',
    vendorUrl: "https://www.amazon.com/s?k=winsor+newton+cotman+45+pan+watercolor+set",
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
    vendorUrl: 'https://www.amazon.com/s?k=tombow+dual+brush+pen+96+pack',
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
