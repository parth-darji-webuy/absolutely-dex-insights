import type { Metadata } from "next";
import { AuthSide } from "@/components/auth/AuthSide";
import { SignInForm } from "@/components/auth/SignInForm";
import { BrandMark } from "@/components/BrandMark";
import { ADMIN } from "@/config/accounts";

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
          <SignInForm defaultEmail={ADMIN.email} />
        </div>
      </main>
    </div>
  );
}
