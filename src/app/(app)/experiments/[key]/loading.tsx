import { Card } from "@/components/ui/Card";

export default function Loading() {
  return (
    <>
      <Card loading skeleton="text" />
      <Card loading skeleton="text" delay={50} />
      <div className="grid grid-cols-2 gap-4 max-[820px]:grid-cols-1">
        <Card loading skeleton="kpi" delay={100} />
        <Card loading skeleton="kpi" delay={150} />
      </div>
      <Card loading skeleton="chart" delay={200} />
    </>
  );
}
