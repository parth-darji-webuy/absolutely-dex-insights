import type { Metadata } from "next";
import { AuthSide } from "@/components/auth/AuthSide";
import { SignInForm } from "@/components/auth/SignInForm";
import { BrandMark } from "@/components/BrandMark";
import { ACCOUNT } from "@/lib/mock-auth";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="auth">
      <AuthSide />
      <main className="auth-main">
        <div className="w-[min(460px,100%)]">
          <div className="auth-logo mb-[22px]">
            <BrandMark variant="dark" priority />
          </div>
          <SignInForm defaultEmail={ACCOUNT.email} />
        </div>
      </main>
    </div>
  );
}
