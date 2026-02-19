/**
 * Winsor & Newton Cotman watercolour preset palettes.
 *
 * RGB values are approximations based on Winsor & Newton published colour swatches.
 * Source: Winsor & Newton Cotman Water Colour official colour chart.
 *
 * Products:
 *   cotman-24 – Cotman Water Colours Sketchers' Pocket Box, 24 half pans
 *   cotman-45 – Cotman Water Colours Studio Set, 45 half pans
 */

export interface CotmanColor {
  code: string;
  name: string;
  rgb: [number, number, number];
}

// ── 24-pan Sketchers' Pocket Box ──────────────────────────────────────────────
export const cotman24: CotmanColor[] = [
  { code: '346', name: 'Lemon Yellow Hue',      rgb: [255, 249, 110] },
  { code: '109', name: 'Cadmium Yellow Hue',    rgb: [255, 218, 42]  },
  { code: '422', name: 'Naples Yellow Hue',     rgb: [255, 228, 148] },
  { code: '090', name: 'Cadmium Orange Hue',    rgb: [255, 152, 0]   },
  { code: '095', name: 'Cadmium Red Hue',       rgb: [218, 51,  31]  },
  { code: '004', name: 'Alizarin Crimson',      rgb: [185, 30,  65]  },
  { code: '502', name: 'Permanent Rose',        rgb: [227, 51,  113] },
  { code: '744', name: 'Yellow Ochre',          rgb: [214, 157, 47]  },
  { code: '552', name: 'Raw Sienna',            rgb: [196, 123, 45]  },
  { code: '074', name: 'Burnt Sienna',          rgb: [180, 78,  35]  },
  { code: '076', name: 'Burnt Umber',           rgb: [110, 54,  24]  },
  { code: '676', name: 'Vandyke Brown',         rgb: [66,  38,  18]  },
  { code: '637', name: 'Terre Verte',           rgb: [97,  138, 107] },
  { code: '599', name: 'Sap Green',             rgb: [78,  133, 69]  },
  { code: '696', name: 'Viridian Hue',          rgb: [40,  143, 116] },
  { code: '312', name: 'Hookers Green Dark',    rgb: [30,  82,  61]  },
  { code: '538', name: 'Prussian Blue',         rgb: [0,   52,  118] },
  { code: '178', name: 'Cobalt Blue Hue',       rgb: [57,  105, 185] },
  { code: '660', name: 'Ultramarine',           rgb: [26,  48,  185] },
  { code: '139', name: 'Cerulean Blue Hue',     rgb: [89,  175, 223] },
  { code: '465', name: 'Paynes Gray',           rgb: [48,  60,  80]  },
  { code: '331', name: 'Ivory Black',           rgb: [34,  30,  30]  },
  { code: '150', name: 'Chinese White',         rgb: [249, 249, 249] },
  { code: '503', name: 'Permanent Sap Green',   rgb: [65,  122, 53]  },
];

// ── 45-pan Studio Set extras (adds to 24) ─────────────────────────────────────
export const cotman45extras: CotmanColor[] = [
  { code: '580', name: 'Raw Umber',             rgb: [115, 82,  45]  },
  { code: '557', name: 'Red Ochre',             rgb: [172, 83,  48]  },
  { code: '362', name: 'Light Red',             rgb: [209, 112, 84]  },
  { code: '317', name: 'Indian Red',            rgb: [160, 68,  65]  },
  { code: '004', name: 'Alizarin Crimson Hue',  rgb: [179, 26,  55]  },
  { code: '507', name: 'Permanent Carmine',     rgb: [186, 22,  68]  },
  { code: '545', name: 'Quinacridone Magenta',  rgb: [204, 35,  122] },
  { code: '733', name: 'Permanent Violet',      rgb: [138, 55,  158] },
  { code: '120', name: 'Cadmium Lemon',         rgb: [255, 245, 60]  },
  { code: '540', name: 'Scarlet Lake',          rgb: [218, 38,  38]  },
  { code: '730', name: 'Rose Madder Hue',       rgb: [224, 90,  115] },
  { code: '394', name: 'Green (Permanent)',     rgb: [50,  150, 80]  },
  { code: '522', name: 'Phthalo Green',         rgb: [15,  122, 100] },
  { code: '235', name: 'Cobalt Green',          rgb: [15,  138, 109] },
  { code: '329', name: 'Intense Blue',          rgb: [0,   64,  170] },
  { code: '663', name: 'Ultramarine (Deep)',    rgb: [17,  32,  160] },
  { code: '140', name: 'Coeruleum Blue Hue',    rgb: [55,  168, 215] },
  { code: '327', name: 'Indigo',               rgb: [52,  44,  108] },
  { code: '084', name: 'Cadmium Yellow Deep Hue', rgb: [255, 190, 0]  },
  { code: '025', name: 'Burnt Sienna (deep)',   rgb: [160, 58,  20]  },
  { code: '470', name: 'Permanent Yellow Deep', rgb: [252, 200, 0]   },
];
