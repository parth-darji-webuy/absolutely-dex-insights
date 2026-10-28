export type Product = {
  name: string;
  id: string;
  slug: string;
  brand: string;
  cat: string;
  short: string;
  h: number;
  price: number;
  views: number;
  qv: number;
  atc: number;
  yday: number;
  opts: string[];
  cols: string[];
};

/** [category, add-to-carts] */
export type CategoryCount = readonly [string, number];
/** [colour name, add-to-carts, swatch hex] */
export type ColourCount = readonly [string, number, string];

export type QuickViewStats = {
  seen: number;
  btn: number;
  eye: number;
  opened: number;
  heartCard: number;
  add: number;
  detail: number;
  wish: number;
  closed: number;
};

export type ProductsData = {
  products: Product[];
  cats: CategoryCount[];
  colours: ColourCount[];
  qv: QuickViewStats;
};
