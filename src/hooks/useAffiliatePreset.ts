import { useCallback } from 'react';
import { useAppStore } from '../state/appStore';
import {
  findPresetPalette,
  palettesForBrand,
  presetBrands,
  type PresetPalette,
} from '../data/paletteRegistry';
import { trackAffiliateClick } from '../utils/analytics';

/**
 * Recommended fallback set used for the Amazon affiliate CTAs when the user
 * hasn't picked a brand preset yet (auto-detect / custom palette modes). The
 * "money" buttons must always point at a real `vendorUrl`, so we default to a
 * sensible, broadly-available set.
 */
const DEFAULT_PRESET_ID = 'crayola-24';

export interface AffiliatePreset {
  /** The currently selected (or fallback) preset that the CTAs link to. */
  preset: PresetPalette;
  brand: string;
  /** Human label for the set, e.g. "Crayola 24" or "Prismacolor Premier 72". */
  setLabel: string;
  /** Destination URL — always the selected preset's affiliate `vendorUrl`. */
  buyUrl: string;
  /** First N swatch colors as CSS `rgb()` strings for the preview row. */
  swatches: string[];
  /** All brand names, in display order. */
  brands: string[];
  /** Whether the user has explicitly chosen this preset (vs. the fallback). */
  isExplicit: boolean;
  /** Select a brand — auto-selects that brand's first set. */
  selectBrand: (brand: string) => void;
  /** Select a specific set by preset id. */
  selectSet: (presetId: string) => void;
  /** Fire the affiliate_click analytics event for the current selection. */
  trackClick: () => void;
}

export function useAffiliatePreset(swatchCount = 9): AffiliatePreset {
  const presetPaletteId = useAppStore((s) => s.settings.presetPaletteId);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const isExplicit = presetPaletteId !== null && findPresetPalette(presetPaletteId) !== undefined;
  const preset =
    findPresetPalette(presetPaletteId ?? '') ?? findPresetPalette(DEFAULT_PRESET_ID)!;

  const swatches = preset.colors
    .slice(0, swatchCount)
    .map((c) => `rgb(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]})`);

  const selectBrand = useCallback(
    (brand: string) => {
      const first = palettesForBrand(brand)[0];
      if (first) updateSettings({ presetPaletteId: first.id, customPalette: null });
    },
    [updateSettings]
  );

  const selectSet = useCallback(
    (presetId: string) => {
      updateSettings({ presetPaletteId: presetId, customPalette: null });
    },
    [updateSettings]
  );

  const trackClick = useCallback(() => {
    trackAffiliateClick(preset.brand, preset.id);
  }, [preset.brand, preset.id]);

  return {
    preset,
    brand: preset.brand,
    setLabel: preset.label,
    buyUrl: preset.vendorUrl,
    swatches,
    brands: presetBrands,
    isExplicit,
    selectBrand,
    selectSet,
    trackClick,
  };
}
