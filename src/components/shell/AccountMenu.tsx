"use client";

import { Icon } from "@/components/Icon";
import { Popover } from "@/components/ui/Popover";

type AccountMenuProps = {
  name: string;
  email: string;
  role: string;
  initials: string;
  /** The sign-out server action, run by the Log out button's form. */
  signOut: () => Promise<void>;
};

/** The round avatar, top right. It opens a small menu: who you are, then Log out. */
export function AccountMenu({ name, email, role, initials, signOut }: AccountMenuProps) {
  return (
    <div className="acct">
      <Popover
        width={280}
        label="Account"
        trigger={(props, open) => (
          <button type="button" className="avatar avatar-btn" aria-label={`Account menu, ${name}`} data-open={open} {...props}>
            {initials}
          </button>
        )}
      >
        <div className="acct-menu">
          <div className="acct-head">
            <b>{name}</b>
            <span className="acct-email">{email}</span>
            <span className="acct-role">{role}</span>
          </div>
          <form action={signOut} className="acct-foot">
            <button type="submit" className="acct-item">
              <Icon name="out" size="sm" />
              Log out
            </button>
          </form>
        </div>
      </Popover>
    </div>
  );
}
