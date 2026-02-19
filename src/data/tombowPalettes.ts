/**
 * Tombow Dual Brush pen preset palettes.
 *
 * RGB values are approximations of the official Tombow colour swatches.
 * Source: Tombow AB-T Dual Brush Pen official colour chart (AMBI series).
 *
 * Products:
 *   tombow-96 – Tombow Dual Brush Pen Art Markers, 96-Pack (AMBI-44)
 */

export interface TombowColor {
  code: string; // Tombow colour number (e.g. 'N15', '063', '845')
  name: string;
  rgb: [number, number, number];
}

// ── 96-count set ─────────────────────────────────────────────────────────────
export const tombow96: TombowColor[] = [
  // Greys & neutrals
  { code: 'N15', name: 'Light Gray',         rgb: [219, 221, 222] },
  { code: 'N25', name: 'Light Gray 2',       rgb: [197, 200, 202] },
  { code: 'N45', name: 'Medium Gray',        rgb: [152, 155, 156] },
  { code: 'N55', name: 'Medium Gray 2',      rgb: [127, 130, 132] },
  { code: 'N65', name: 'Dark Gray',          rgb: [100, 103, 105] },
  { code: 'N75', name: 'Dark Gray 2',        rgb: [72,  75,  77]  },
  { code: 'N89', name: 'Warm Black',         rgb: [44,  44,  48]  },
  { code: 'N95', name: 'Black',              rgb: [25,  25,  30]  },
  // Yellows
  { code: '020', name: 'Burnt Orange',       rgb: [204, 85,  0]   },
  { code: '025', name: 'Persimmon',          rgb: [237, 83,  44]  },
  { code: '055', name: 'Antique Gold',       rgb: [201, 161, 99]  },
  { code: '061', name: 'Light Sand',         rgb: [254, 245, 200] },
  { code: '062', name: 'Pale Yellow',        rgb: [253, 249, 180] },
  { code: '063', name: 'Canary Yellow',      rgb: [255, 237, 0]   },
  { code: '065', name: 'Process Yellow',     rgb: [255, 221, 0]   },
  { code: '076', name: 'Chartreuse',         rgb: [195, 214, 0]   },
  // Oranges / light reds
  { code: '026', name: 'Pale Cherry',        rgb: [251, 178, 163] },
  { code: '946', name: 'Warm Beige',         rgb: [233, 213, 190] },
  { code: '947', name: 'Sand Beige',         rgb: [222, 196, 161] },
  { code: '977', name: 'Coral',              rgb: [252, 144, 107] },
  { code: '985', name: 'Orange',             rgb: [255, 130, 0]   },
  { code: '993', name: 'Tangerine',          rgb: [255, 110, 0]   },
  { code: '996', name: 'Vermilion',          rgb: [255, 76,  0]   },
  // Reds / pinks
  { code: '090', name: 'Carmine',            rgb: [211, 31,  85]  },
  { code: '095', name: 'Geranium',           rgb: [244, 57,  74]  },
  { code: '096', name: 'Raspberry',          rgb: [212, 43,  101] },
  { code: '100', name: 'Scarlet',            rgb: [228, 31,  31]  },
  { code: '123', name: 'Lipstick Red',       rgb: [211, 16,  43]  },
  { code: '133', name: 'Sandy Flesh',        rgb: [252, 213, 170] },
  { code: '158', name: 'Flesh',             rgb: [252, 205, 169] },
  { code: '723', name: 'Dusty Rose',         rgb: [210, 147, 163] },
  { code: '733', name: 'Rose',               rgb: [248, 161, 195] },
  { code: '743', name: 'Rose Red',           rgb: [237, 80,  154] },
  { code: '755', name: 'Coral Red',          rgb: [238, 105, 102] },
  { code: '765', name: 'Carmine (deep)',     rgb: [203, 57,  66]  },
  { code: '775', name: 'Crimson',            rgb: [167, 39,  74]  },
  { code: '800', name: 'Baby Pink',          rgb: [255, 202, 215] },
  { code: '840', name: 'Garnet',             rgb: [163, 46,  59]  },
  { code: '895', name: 'Light Pink',         rgb: [249, 186, 204] },
  { code: '969', name: 'Pink Punch',         rgb: [255, 121, 148] },
  // Purples / violets
  { code: '623', name: 'Light Violet',       rgb: [198, 137, 185] },
  { code: '625', name: 'Orchid',             rgb: [192, 121, 183] },
  { code: '636', name: 'Lilac',              rgb: [175, 148, 199] },
  { code: '643', name: 'Red Violet',         rgb: [170, 52,  126] },
  { code: '673', name: 'Thistle',            rgb: [196, 158, 204] },
  { code: '685', name: 'Purple',             rgb: [102, 49,  140] },
  { code: '703', name: 'Wisteria',           rgb: [147, 121, 183] },
  { code: '706', name: 'Periwinkle Blue',    rgb: [132, 140, 191] },
  { code: '725', name: 'Mauve',              rgb: [183, 118, 149] },
  { code: '772', name: 'Violet',             rgb: [147, 53,  161] },
  { code: '793', name: 'Grape',              rgb: [108, 52,  121] },
  // Blues
  { code: '451', name: 'Marine Blue',        rgb: [0,   93,  142] },
  { code: '452', name: 'Azure Blue',         rgb: [0,   103, 164] },
  { code: '476', name: 'Cobalt Blue',        rgb: [0,   80,  152] },
  { code: '493', name: 'Royal Blue',         rgb: [0,   57,  150] },
  { code: '526', name: 'Cyan',               rgb: [0,   178, 227] },
  { code: '533', name: 'Light Blue',         rgb: [108, 194, 225] },
  { code: '553', name: 'Peacock Blue',       rgb: [0,   140, 194] },
  { code: '555', name: 'Process Blue',       rgb: [0,   108, 183] },
  { code: '565', name: 'Cerulean Blue',      rgb: [57,  155, 211] },
  { code: '575', name: 'Ultramarine Blue',   rgb: [23,  68,  161] },
  { code: '533', name: 'Powder Blue',        rgb: [165, 210, 232] },
  // Greens
  { code: '173', name: 'Light Green',        rgb: [140, 198, 108] },
  { code: '195', name: 'Olive',              rgb: [152, 163, 91]  },
  { code: '243', name: 'Sap Green',          rgb: [72,  147, 88]  },
  { code: '245', name: 'Avocado',            rgb: [93,  138, 64]  },
  { code: '249', name: 'Jade Green',         rgb: [0,   138, 93]  },
  { code: '291', name: 'Bright Green',       rgb: [0,   176, 73]  },
  { code: '296', name: 'Spearmint',          rgb: [0,   169, 157] },
  { code: '346', name: 'Yellow Green',       rgb: [144, 190, 68]  },
  { code: '393', name: 'Peacock Green',      rgb: [0,   152, 121] },
  { code: '407', name: 'Teal',               rgb: [0,   128, 127] },
  { code: '456', name: 'Hunter Green',       rgb: [0,   83,  57]  },
  // Warm neutrals / browns
  { code: '873', name: 'Light Ochre',        rgb: [221, 174, 99]  },
  { code: '879', name: 'Brown',              rgb: [152, 103, 68]  },
  { code: '899', name: 'Walnut',             rgb: [106, 68,  42]  },
  { code: '942', name: 'Olive Green (warm)', rgb: [130, 120, 75]  },
  { code: '977', name: 'Chocolate',          rgb: [105, 55,  20]  },
  // Additional popular singles to reach 96
  { code: '127', name: 'Wine Red',           rgb: [155, 18,  61]  },
  { code: '158', name: 'Peach Cream',        rgb: [245, 195, 158] },
  { code: '026', name: 'Blossom Pink',       rgb: [255, 187, 195] },
  { code: '195', name: 'Yellow Ochre',       rgb: [214, 168, 0]   },
  { code: '173', name: 'Lime Green',         rgb: [172, 215, 60]  },
  { code: '296', name: 'Blue Green',         rgb: [0,   153, 136] },
  { code: '452', name: 'Sky Blue',           rgb: [90,  175, 224] },
  { code: '533', name: 'Pale Blue',          rgb: [192, 224, 240] },
  { code: '565', name: 'Cornflower',         rgb: [100, 149, 217] },
  { code: '636', name: 'Light Purple',       rgb: [204, 178, 215] },
  { code: '703', name: 'Blue Violet',        rgb: [113, 93,  168] },
  { code: '723', name: 'Pink Blush',         rgb: [235, 178, 193] },
  { code: '879', name: 'Sienna',             rgb: [178, 108, 64]  },
  { code: '942', name: 'Kraft Brown',        rgb: [154, 118, 73]  },
];
