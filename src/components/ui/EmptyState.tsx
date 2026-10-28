import { EMPTY_LOOK } from "@/components/people/look";
import { Person } from "@/components/people/Person";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  title: string;
  text?: string;
  /** e.g. a Retry button. */
  action?: React.ReactNode;
  className?: string;
};

/** "Nothing here" with the little character, used for empty, error and not-found cards. */
export function EmptyState({ title, text, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex min-h-[140px] flex-col items-center justify-center gap-1.5 px-4 py-[34px] text-center", className)}>
      <div className="relative mb-1 flex h-24 items-end justify-center">
        <span className="absolute bottom-0 h-1.5 w-[46px] rounded-full bg-[rgba(30,40,88,.08)]" />
        <Person look={EMPTY_LOOK} h={84} prop="glass" motion="idle" />
      </div>
      <b className="text-sm font-semibold">{title}</b>
      {text && <p className="max-w-[340px] text-[13px] text-text2">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
