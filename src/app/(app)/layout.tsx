import { Suspense } from "react";
import { Account, AccountSkeleton } from "@/components/shell/Account";
import { AppShell } from "@/components/shell/AppShell";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { PaletteLoader } from "@/components/shell/PaletteLoader";
import { PaletteProvider } from "@/components/shell/PaletteProvider";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <PaletteProvider>
      <AppShell
        account={
          <Suspense fallback={<AccountSkeleton />}>
            <Account />
          </Suspense>
        }
      >
        {children}
      </AppShell>
      <Suspense fallback={<CommandPalette experiments={[]} suggestions={[]} />}>
        <PaletteLoader />
      </Suspense>
    </PaletteProvider>
  );
}
