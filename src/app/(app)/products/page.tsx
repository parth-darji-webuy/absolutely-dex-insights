import type { Metadata } from "next";
import { CategoriesCard, ColoursCard, HeatGridCard } from "@/components/products/ProductCards";
import { PageHeading } from "@/components/shell/PageHeading";
import { CardSlot } from "@/components/ui/CardSlot";

export const metadata: Metadata = { title: "Products" };

export default function Page() {
  return (
    <>
      <PageHeading page="products" />
      <CardSlot title="Product heat grid" subtitle="This week · darker = hotter within each column" skeleton="table">
        <HeatGridCard />
      </CardSlot>
      <div className="grid grid-cols-2 gap-4 max-[820px]:grid-cols-1">
        <CardSlot title="Popular categories" subtitle="Share of add-to-carts" skeleton="list" delay={140}>
          <CategoriesCard />
        </CardSlot>
        <CardSlot title="Popular colours" subtitle="Share of add-to-carts" skeleton="list" delay={140}>
          <ColoursCard />
        </CardSlot>
      </div>
    </>
  );
}
