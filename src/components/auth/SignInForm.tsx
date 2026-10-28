"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { signInAction } from "@/app/sign-in/actions";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Phase = "idle" | "loading" | "done";
type Errors = { email?: string; password?: string; form?: { title: string; detail: string } };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const INPUT =
  "h-12 w-full rounded-[4px] border bg-card pr-[46px] pl-[42px] text-[15px] text-text outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]";

// Always rendered, even when empty: like the prototype, the empty slot keeps the spacing between fields.
function FieldError({ id, children }: { id: string; children?: string }) {
  return (
    <div id={id} role="alert">
      {children && (
        <span className="flex items-center gap-[5px] text-xs text-red">
          <Icon name="warn" size="sm" /> {children}
        </span>
      )}
    </div>
  );
}

export function SignInForm({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter();
  const form = useRef<HTMLDivElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [caps, setCaps] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const [firstName, setFirstName] = useState("");

  const emailOk = EMAIL_RE.test(email.trim());
  const busy = phase !== "idle";

  const shake = () => {
    const el = form.current;
    if (!el) return;
    el.classList.remove("shake");
    void el.offsetWidth; // restart the animation
    el.classList.add("shake");
  };

  const fail = (e: Errors) => {
    setErrors(e);
    setPhase("idle");
    shake();
    (e.password && !e.email ? passwordInput : emailInput).current?.focus();
  };

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (busy) return;
    const mail = email.trim();
    const found: Errors = {};
    if (!mail) found.email = "Enter your email address";
    else if (!EMAIL_RE.test(mail)) found.email = "That doesn’t look like an email address";
    if (!password) found.password = "Enter your password";
    else if (password.length < 8) found.password = "Passwords are at least 8 characters";
    if (found.email || found.password) return fail(found);

    setErrors({});
    setPhase("loading");
    const quick = reduced();
    const [result] = await Promise.all([signInAction(mail, password), wait(quick ? 0 : 700)]);
    if (!result.ok) return fail({ form: { title: result.title, detail: result.detail } });

    setFirstName(result.firstName);
    setPhase("done");
    await wait(quick ? 0 : 450);
    router.replace("/overview");
    router.refresh();
  }

  return (
    <div ref={form} className="auth-form fade">
      <h2>Sign in</h2>
      <form className="flex flex-col gap-[18px]" onSubmit={onSubmit} noValidate>
        <div role="alert">
          {errors.form && (
            <div className="flex items-start gap-2.5 rounded-[9px] border border-[color-mix(in_srgb,var(--red)_30%,transparent)] bg-red-soft px-3 py-2.5 text-[13px] text-red">
              <Icon name="warn" />
              <span className="text-text">
                <b>{errors.form.title}</b> {errors.form.detail}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[15px] text-text">
            Email address
          </label>
          <div className="group relative">
            <span className="pointer-events-none absolute top-1/2 left-3.5 flex -translate-y-1/2 text-text3 transition-colors duration-150 group-focus-within:text-accent">
              <Icon name="user" size="sm" />
            </span>
            <input
              ref={emailInput}
              id="email"
              name="email"
              type="email"
              value={email}
              readOnly={busy}
              autoComplete="email"
              spellCheck={false}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                if (EMAIL_RE.test(e.target.value.trim())) setErrors((x) => ({ ...x, email: undefined }));
              }}
              className={cn(INPUT, errors.email ? "border-red" : "border-[#cfd0d8] hover:not-focus:border-[#a9abb8]")}
            />
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute top-1/2 right-[15px] flex text-green transition-[opacity,transform] duration-[250ms] ease-proto",
                emailOk ? "-translate-y-1/2 scale-100 opacity-100" : "-translate-y-1/2 scale-[.4] opacity-0",
              )}
            >
              <Icon name="check" size="sm" />
            </span>
          </div>
          <FieldError id="email-error">{errors.email}</FieldError>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[15px] text-text">
            Password
          </label>
          <div className="group relative">
            <span className="pointer-events-none absolute top-1/2 left-3.5 flex -translate-y-1/2 text-text3 transition-colors duration-150 group-focus-within:text-accent">
              <Icon name="lock" size="sm" />
            </span>
            <input
              ref={passwordInput}
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              readOnly={busy}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              onChange={(e) => {
                setPassword(e.target.value);
                if (e.target.value.length >= 8) setErrors((x) => ({ ...x, password: undefined }));
              }}
              onKeyDown={(e) => setCaps(e.getModifierState("CapsLock"))}
              onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))}
              onBlur={() => setCaps(false)}
              className={cn(INPUT, errors.password ? "border-red" : "border-[#cfd0d8] hover:not-focus:border-[#a9abb8]")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              onClick={() => {
                setShowPassword((s) => !s);
                passwordInput.current?.focus();
              }}
              className="absolute top-1/2 right-1.5 grid size-[38px] -translate-y-1/2 cursor-pointer place-items-center rounded-md text-text3 hover:bg-hover hover:text-text"
            >
              <Icon name={showPassword ? "eyeoff" : "eye"} size="sm" />
            </button>
          </div>
          {caps && (
            <div role="status" className="flex items-center gap-1.5 text-[12.5px] font-medium text-amber">
              <Icon name="warn" size="sm" /> Caps Lock is on
            </div>
          )}
          <FieldError id="password-error">{errors.password}</FieldError>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="auth"
          className={cn("group mt-3.5", phase === "loading" && "pointer-events-none opacity-90", phase === "done" && "pointer-events-none border-green bg-green")}
        >
          {phase === "idle" && (
            <>
              <span>Sign in</span>
              <span className="flex transition-transform duration-200 ease-proto group-hover:translate-x-1">
                <Icon name="arrow" size="sm" />
              </span>
            </>
          )}
          {phase === "loading" && (
            <>
              <span className="spin" />
              <span>Signing in…</span>
            </>
          )}
          {phase === "done" && (
            <>
              <Icon name="check" size="sm" />
              <span>Welcome back, {firstName}</span>
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
