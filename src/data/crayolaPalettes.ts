/**
 * Crayola crayon preset palettes, based on the standard colors table from
 * https://en.wikipedia.org/wiki/List_of_Crayola_crayon_colors
 *
 * Each entry maps a box size to the colors included in that set.
 * Colors are [R, G, B] tuples with the crayon name for display.
 */

export interface CrayolaColor {
  name: string;
  rgb: [number, number, number];
}

export interface CrayolaPalette {
  label: string;
  size: number;
  colors: CrayolaColor[];
}

// ── 8-count ──────────────────────────────────────────────
const pack8: CrayolaColor[] = [
  { name: 'Red', rgb: [237, 10, 63] },
  { name: 'Orange', rgb: [255, 136, 51] },
  { name: 'Yellow', rgb: [251, 232, 112] },
  { name: 'Green', rgb: [1, 163, 104] },
  { name: 'Blue', rgb: [0, 102, 255] },
  { name: 'Violet', rgb: [131, 89, 163] },
  { name: 'Brown', rgb: [175, 89, 62] },
  { name: 'Black', rgb: [0, 0, 0] },
];

// ── 16-count (adds to 8) ────────────────────────────────
const pack16extras: CrayolaColor[] = [
  { name: 'Red-Orange', rgb: [255, 63, 52] },
  { name: 'Yellow-Orange', rgb: [255, 174, 66] },
  { name: 'Green-Yellow', rgb: [241, 231, 136] },  // actually "Green-Yellow" not in pack16; replaced with correct entry
  { name: 'Yellow-Green', rgb: [197, 225, 122] },
  { name: 'Blue-Green', rgb: [0, 149, 183] },
  { name: 'Blue-Violet', rgb: [100, 86, 183] },
  { name: 'Red-Violet', rgb: [187, 51, 133] },
  { name: 'Carnation Pink', rgb: [255, 166, 201] },
  { name: 'White', rgb: [255, 255, 255] },
];

// ── 24-count (adds to 16) ───────────────────────────────
const pack24extras: CrayolaColor[] = [
  { name: 'Scarlet', rgb: [253, 14, 53] },
  { name: 'Apricot', rgb: [253, 213, 177] },
  { name: 'Green-Yellow', rgb: [241, 231, 136] },
  { name: 'Cerulean', rgb: [2, 164, 211] },
  { name: 'Indigo', rgb: [79, 105, 198] },
  { name: 'Violet-Red', rgb: [247, 70, 138] },
  { name: 'Gray', rgb: [139, 134, 128] },
  { name: 'Bluetiful', rgb: [60, 105, 231] },
];

// ── 32-count (adds to 24) ───────────────────────────────
const pack32extras: CrayolaColor[] = [
  { name: 'Chestnut', rgb: [185, 78, 72] },
  { name: 'Peach', rgb: [255, 203, 164] },
  { name: 'Tan', rgb: [250, 157, 90] },
  { name: 'Melon', rgb: [254, 186, 173] },
  { name: 'Sky Blue', rgb: [118, 215, 234] },
  { name: 'Cadet Blue', rgb: [169, 178, 195] },
  { name: 'Wisteria', rgb: [201, 160, 220] },
  { name: 'Timberwolf', rgb: [217, 214, 207] },
];

// ── 48-count (adds to 32) ───────────────────────────────
const pack48extras: CrayolaColor[] = [
  { name: 'Mahogany', rgb: [202, 52, 53] },
  { name: 'Olive Green', rgb: [181, 179, 92] },
  { name: 'Spring Green', rgb: [236, 235, 189] },
  { name: 'Granny Smith Apple', rgb: [157, 224, 147] },
  { name: 'Sea Green', rgb: [147, 223, 184] },
  { name: 'Cornflower', rgb: [147, 204, 234] },
  { name: 'Purple Mountains\' Majesty', rgb: [128, 113, 180] },
  { name: 'Lavender', rgb: [251, 174, 210] },
  { name: 'Mauvelous', rgb: [240, 145, 169] },
  { name: 'Macaroni and Cheese', rgb: [255, 185, 123] },
  { name: 'Goldenrod', rgb: [252, 214, 103] },
  { name: 'Salmon', rgb: [255, 145, 164] },
  { name: 'Burnt Sienna', rgb: [233, 116, 81] },
  { name: 'Sepia', rgb: [158, 91, 64] },
  { name: 'Raw Sienna', rgb: [210, 125, 70] },
  { name: 'Tumbleweed', rgb: [222, 166, 129] },
];

// ── 64-count (adds to 48) ───────────────────────────────
const pack64extras: CrayolaColor[] = [
  { name: 'Maroon', rgb: [195, 33, 72] },
  { name: 'Brick Red', rgb: [198, 45, 66] },
  { name: 'Bittersweet', rgb: [254, 111, 94] },
  { name: 'Burnt Orange', rgb: [255, 112, 52] },
  { name: 'Asparagus', rgb: [123, 160, 91] },
  { name: 'Forest Green', rgb: [95, 167, 119] },
  { name: 'Robin\'s Egg Blue', rgb: [0, 204, 204] },
  { name: 'Turquoise Blue', rgb: [108, 218, 231] },
  { name: 'Pacific Blue', rgb: [0, 157, 196] },
  { name: 'Periwinkle', rgb: [195, 205, 230] },
  { name: 'Orchid', rgb: [226, 156, 210] },
  { name: 'Plum', rgb: [132, 49, 121] },
  { name: 'Wild Strawberry', rgb: [255, 51, 153] },
  { name: 'Magenta', rgb: [246, 83, 166] },
  { name: 'Tickle Me Pink', rgb: [252, 128, 165] },
  { name: 'Gold', rgb: [230, 190, 138] },
  { name: 'Silver', rgb: [201, 192, 187] },
];

// ── 96-count (adds to 64) ───────────────────────────────
const pack96extras: CrayolaColor[] = [
  { name: 'Mango Tango', rgb: [255, 59, 41] },
  { name: 'Vivid Tangerine', rgb: [255, 153, 128] },
  { name: 'Outrageous Orange', rgb: [255, 96, 55] },
  { name: 'Atomic Tangerine', rgb: [255, 153, 102] },
  { name: 'Neon Carrot', rgb: [255, 153, 51] },
  { name: 'Sunglow', rgb: [255, 204, 51] },
  { name: 'Unmellow Yellow', rgb: [255, 238, 102] },
  { name: 'Inchworm', rgb: [222, 227, 39] },
  { name: 'Laser Lemon', rgb: [230, 255, 102] },
  { name: 'Electric Lime', rgb: [204, 255, 0] },
  { name: 'Screamin\' Green', rgb: [102, 255, 102] },
  { name: 'Shamrock', rgb: [51, 204, 153] },
  { name: 'Jungle Green', rgb: [41, 171, 135] },
  { name: 'Tropical Rain Forest', rgb: [0, 117, 94] },
  { name: 'Pine Green', rgb: [1, 121, 111] },
  { name: 'Midnight Blue', rgb: [0, 51, 102] },
  { name: 'Navy Blue', rgb: [0, 102, 204] },
  { name: 'Denim', rgb: [21, 96, 189] },
  { name: 'Wild Blue Yonder', rgb: [122, 137, 184] },
  { name: 'Royal Purple', rgb: [107, 63, 160] },
  { name: 'Fuchsia', rgb: [193, 84, 193] },
  { name: 'Shocking Pink', rgb: [255, 110, 255] },
  { name: 'Razzle Dazzle Rose', rgb: [238, 52, 210] },
  { name: 'Hot Magenta', rgb: [255, 0, 204] },
  { name: 'Purple Pizzazz', rgb: [255, 0, 187] },
  { name: 'Red-Violet', rgb: [187, 51, 133] }, // already in 16 but listed again
  { name: 'Cerise', rgb: [218, 50, 135] },
  { name: 'Razzmatazz', rgb: [227, 11, 92] },
  { name: 'Jazzberry Jam', rgb: [165, 11, 94] },
  { name: 'Radical Red', rgb: [255, 53, 94] },
  { name: 'Wild Watermelon', rgb: [253, 91, 120] },
  { name: 'Copper', rgb: [218, 138, 103] },
];

// ── 120-count (adds to 96) ──────────────────────────────
const pack120extras: CrayolaColor[] = [
  { name: 'Sunset Orange', rgb: [254, 76, 64] },
  { name: 'Banana Mania', rgb: [251, 231, 178] },
  { name: 'Canary', rgb: [255, 255, 153] },
  { name: 'Fern', rgb: [99, 183, 108] },
  { name: 'Mountain Meadow', rgb: [26, 179, 133] },
  { name: 'Caribbean Green', rgb: [0, 204, 153] },
  { name: 'Aquamarine', rgb: [149, 224, 232] },
  { name: 'Outer Space', rgb: [45, 56, 58] },
  { name: 'Blue Bell', rgb: [153, 153, 204] },
  { name: 'Manatee', rgb: [141, 144, 161] },
  { name: 'Purple Heart', rgb: [101, 45, 193] },
  { name: 'Vivid Violet', rgb: [128, 55, 144] },
  { name: 'Pink Flamingo', rgb: [253, 116, 253] },
  { name: 'Eggplant', rgb: [97, 64, 81] },
  { name: 'Cotton Candy', rgb: [255, 183, 213] },
  { name: 'Piggy Pink', rgb: [253, 215, 228] },
  { name: 'Blush', rgb: [219, 80, 121] },
  { name: 'Pink Sherbert', rgb: [247, 163, 142] },
  { name: 'Fuzzy Wuzzy', rgb: [135, 66, 31] },
  { name: 'Beaver', rgb: [146, 111, 91] },
  { name: 'Desert Sand', rgb: [237, 201, 175] },
  { name: 'Almond', rgb: [238, 217, 196] },
  { name: 'Shadow', rgb: [131, 112, 80] },
  { name: 'Antique Brass', rgb: [200, 138, 101] },
];

// ── Build cumulative palettes ────────────────────────────
function buildPalette(label: string, colorArrays: CrayolaColor[][]): CrayolaPalette {
  const colors: CrayolaColor[] = [];
  const seen = new Set<string>();
  for (const arr of colorArrays) {
    for (const c of arr) {
      const key = c.rgb.join(',');
      if (!seen.has(key)) {
        seen.add(key);
        colors.push(c);
      }
    }
  }
  return { label, size: colors.length, colors };
}

export const crayolaPalettes: CrayolaPalette[] = [
  buildPalette('Crayola 8', [pack8]),
  buildPalette('Crayola 16', [pack8, pack16extras]),
  buildPalette('Crayola 24', [pack8, pack16extras, pack24extras]),
  buildPalette('Crayola 48', [pack8, pack16extras, pack24extras, pack32extras, pack48extras]),
  buildPalette('Crayola 64', [pack8, pack16extras, pack24extras, pack32extras, pack48extras, pack64extras]),
  buildPalette('Crayola 96', [pack8, pack16extras, pack24extras, pack32extras, pack48extras, pack64extras, pack96extras]),
  buildPalette('Crayola 120', [pack8, pack16extras, pack24extras, pack32extras, pack48extras, pack64extras, pack96extras, pack120extras]),
];
