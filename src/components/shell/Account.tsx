import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { signOutAction } from "@/app/sign-in/actions";
import { requireUser } from "@/lib/session";

/** The signed-in person, top right, with Sign out. Streams in behind a Suspense boundary. */
export async function Account() {
  const user = await requireUser();
  return (
    <div className="acct">
      <span className="avatar" aria-hidden="true">
        {user.initials}
      </span>
      <span className="who">
        <b>{user.name}</b>
        <span>
          {user.role} · {user.email}
        </span>
      </span>
      <form action={signOutAction}>
        <Button type="submit" className="signout" title="Sign out">
          <Icon name="out" size="sm" />
          <span>Sign out</span>
        </Button>
      </form>
    </div>
  );
}

export function AccountSkeleton() {
  return (
    <div className="acct" aria-hidden="true">
      <Skeleton w="36px" h={36} className="rounded-full" />
      <span className="who">
        <Skeleton w="110px" h={12} />
        <Skeleton w="170px" h={10} className="mt-1.5" />
      </span>
    </div>
  );
}
