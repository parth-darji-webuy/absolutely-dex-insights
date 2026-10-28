export type Answer = {
  q: string;
  a: string;
  bars: [string, number][];
  unit?: string;
  cols: string[];
  rows: string[][];
  sql: string;
};
