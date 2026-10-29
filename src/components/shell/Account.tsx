import { Skeleton } from "@/components/ui/Skeleton";
import { signOutAction } from "@/app/sign-in/actions";
import { requireUser } from "@/lib/session";
import { AccountMenu } from "./AccountMenu";

/** The signed-in person, top right, as an avatar with a menu. Streams in behind a Suspense boundary. */
export async function Account() {
  const user = await requireUser();
  return <AccountMenu name={user.name} email={user.email} role={user.role} initials={user.initials} signOut={signOutAction} />;
}

export function AccountSkeleton() {
  return (
    <div className="acct" aria-hidden="true">
      <Skeleton w="36px" h={36} className="rounded-full" />
    </div>
  );
}
