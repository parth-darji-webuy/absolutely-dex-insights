import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Delta } from "@/components/ui/Delta";
import { EmptyState } from "@/components/ui/EmptyState";
import { AreaChart, BarChart, Donut, HBars, LiftRange, MiniBars, Sparkline, XSpark } from ".";

const BAD = /NaN|undefined|Infinity/;
const html = (el: React.ReactElement) => renderToStaticMarkup(el);
const series = (values: number[]) => [{ key: "a", name: "A", color: "red", values }];

describe("charts never print NaN, undefined or Infinity", () => {
  const labels = ["a", "b", "c"];
  const cases: [string, React.ReactElement][] = [
    ["Sparkline empty", <Sparkline key="1" values={[]} />],
    ["Sparkline one value", <Sparkline key="2" values={[5]} />],
    ["Sparkline all zero", <Sparkline key="3" values={[0, 0, 0]} />],
    ["Sparkline broken", <Sparkline key="4" values={[1, NaN, 3]} />],
    ["AreaChart no labels", <AreaChart key="5" labels={[]} series={series([])} />],
    ["AreaChart one point", <AreaChart key="6" labels={["a"]} series={series([4])} />],
    ["AreaChart all zero", <AreaChart key="7" labels={labels} series={series([0, 0, 0])} />],
    ["AreaChart stacked zero", <AreaChart key="8" labels={labels} stacked series={[...series([0, 0, 0]), { key: "b", name: "B", color: "blue", values: [0, 0, 0] }]} />],
    ["AreaChart broken", <AreaChart key="9" labels={labels} series={series([1, NaN, undefined as unknown as number])} />],
    ["AreaChart all hidden", <AreaChart key="10" labels={labels} series={series([1, 2, 3])} hidden={["a"]} />],
    ["BarChart no labels", <BarChart key="11" labels={[]} series={[]} />],
    ["BarChart all zero", <BarChart key="12" labels={labels} series={[{ name: "A", color: "red", values: [0, 0, 0] }]} />],
    ["BarChart one bar", <BarChart key="13" labels={["a"]} series={[{ name: "A", color: "red", values: [7] }]} />],
    ["HBars empty", <HBars key="14" rows={[]} />],
    ["HBars all zero", <HBars key="15" rows={[["a", 0], ["b", 0]]} />],
    ["HBars percent", <HBars key="16" rows={[["a", 12], ["b", 10]]} unit="%" />],
    ["Donut empty", <Donut key="17" segments={[]} />],
    ["Donut all zero", <Donut key="18" segments={[{ label: "a", value: 0, color: "red" }, { label: "b", value: 0, color: "blue" }]} />],
    ["Donut one segment", <Donut key="19" segments={[{ label: "a", value: 5, color: "red" }]} center="5" sub="total" />],
    ["LiftRange sample", <LiftRange key="23" lift={20} range={[-3, 45]} lead />],
    ["LiftRange flat", <LiftRange key="24" lift={0} range={[0, 0]} />],
    ["LiftRange broken", <LiftRange key="25" lift={NaN} range={[NaN, NaN]} />],
    ["XSpark empty", <XSpark key="26" control={[]} treatment={[]} />],
    ["XSpark one point", <XSpark key="27" control={[3]} treatment={[4]} />],
    ["XSpark flat", <XSpark key="28" control={[2, 2]} treatment={[2, 2]} />],
    ["MiniBars empty", <MiniBars key="29" values={[]} tips={[]} />],
    ["MiniBars all zero", <MiniBars key="30" values={[0, 0, 0]} tips={[]} />],
    ["Delta nothing to compare", <Delta key="31" value={NaN} />],
    ["Delta null", <Delta key="32" value={null} />],
  ];
  it.each(cases)("%s", (_name, el) => {
    expect(html(el)).not.toMatch(BAD);
  });

  it("empty data shows the empty state, not a broken chart", () => {
    expect(html(<AreaChart labels={[]} series={[]} />)).toContain("No data yet");
    expect(html(<AreaChart labels={["a"]} series={series([1])} hidden={["a"]} />)).toContain("All series hidden");
    expect(html(<HBars rows={[]} />)).toContain("No data yet");
  });

  it("Delta shows — when there is nothing to compare", () => {
    expect(html(<Delta value={NaN} label="" />)).toContain("—");
    expect(html(<Delta value={7.44} />)).toContain("▲ 7.4%");
    expect(html(<Delta value={-2} />)).toContain("▼ 2.0%");
    expect(html(<Delta value={0.01} label="" />)).toContain("No change");
  });

  it("donut list shows — for shares when the total is zero", () => {
    const out = html(<Donut segments={[{ label: "a", value: 0, color: "red" }]} />);
    expect(out).toContain("—");
  });

  it("EmptyState draws the character", () => {
    expect(html(<EmptyState title="Nothing yet" text="Come back later." />)).toMatch(/<svg class="person idle"/);
  });
});
