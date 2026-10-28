import { BrandMark, type BrandVariant } from "@/components/BrandMark";
import { ICON_NAMES, Icon } from "@/components/Icon";

// Temporary preview (phase 1): colours, icons and logos. Replaced by the Overview page later.
const SURFACES = ["bg", "side", "card", "card2", "hover", "border", "border2"];
const INK = ["text", "text2", "text3", "accent", "accent-h", "accent-text", "green", "red", "amber"];
const SERIES = ["c1", "c2", "c3", "c4", "c5", "c6"];
const LOGOS: { variant: BrandVariant; bg: string }[] = [
  { variant: "dark", bg: "bg-white" },
  { variant: "light", bg: "bg-side" },
  { variant: "white", bg: "bg-accent" },
  { variant: "mark", bg: "bg-side" },
];

function Swatches({ names }: { names: string[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {names.map((n) => (
        <div key={n} className="w-[104px]">
          <div className="h-12 rounded-lg border border-border" style={{ background: `var(--${n})` }} />
          <div className="mt-1 text-xs font-medium">{n}</div>
          <div className="text-xs text-text3">--{n}</div>
        </div>
      ))}
    </div>
  );
}

export default function PreviewPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Phase 1 preview</h1>
        <p className="mt-1 text-text2">Colours, icons and logos from the prototype. This page is temporary.</p>
      </header>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Colours</h2>
        <div className="space-y-5">
          <Swatches names={SURFACES} />
          <Swatches names={INK} />
          <Swatches names={SERIES} />
          <div className="flex gap-2">
            <span className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-on-accent">Accent button</span>
            <span className="rounded-md bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent-text">Active nav</span>
            <span className="rounded-md bg-green-soft px-3 py-1.5 text-sm font-medium text-green">Up</span>
            <span className="rounded-md bg-red-soft px-3 py-1.5 text-sm font-medium text-red">Down</span>
            <span className="rounded-md border border-amber-border bg-amber-soft px-3 py-1.5 text-sm font-medium text-amber">Warning</span>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Icons</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-3">
          {ICON_NAMES.map((n) => (
            <div key={n} className="flex flex-col items-center gap-1.5 rounded-lg bg-card2 py-3 text-text2">
              <Icon name={n} />
              <span className="text-xs">{n}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Logos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {LOGOS.map(({ variant, bg }) => (
            <div key={variant} className={`${bg} flex items-center gap-4 rounded-lg border border-border p-5`}>
              <BrandMark variant={variant} />
              <span className="text-xs text-text3">{variant}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
