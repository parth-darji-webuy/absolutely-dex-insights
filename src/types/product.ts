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
  /** Button views, wishlist, detail and close clicks are not recorded by the store yet. */
  extrasTracked: boolean;
};

export type ProductsData = {
  products: Product[];
  cats: CategoryCount[];
  colours: ColourCount[];
  qv: QuickViewStats;
  /** This week's people for the three funnels: everyone active, those who opened What's New, those who added to cart. */
  funnels: { people: number; whatsNew: number; addToCart: number };
  /** Product page views are not recorded by the store yet. */
  viewsTracked: boolean;
};
