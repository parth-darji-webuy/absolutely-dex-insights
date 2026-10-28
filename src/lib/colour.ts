// The store records a colour's name, not its code. This picks a swatch that looks like the name.
const SWATCHES: [RegExp, string][] = [
  [/black|obsidian|raven|onyx|ebony/i, "#16181d"],
  [/white|chalk|pearl|ivory/i, "#f4f4f2"],
  [/graphite|grey|gray|slate|charcoal|titanium|steel|silver/i, "#4a4d55"],
  [/navy|midnight|blue|indigo/i, "#24336b"],
  [/cognac|brown|tan|camel|chocolate|bronze/i, "#9a5a2e"],
  [/red|burgundy|maroon|crimson/i, "#b3362f"],
  [/olive|green|moss|forest|sage/i, "#5b6b3a"],
  [/cream|sand|beige|stone|oat/i, "#d8c9a8"],
];

/** A hex colour for a colour name; mid grey when the name is unfamiliar. */
export const swatchFor = (name: string): string => SWATCHES.find(([re]) => re.test(name))?.[1] ?? "#9aa0ad";
