import { AuthBackdrop } from "@/components/auth/auth-backdrop";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-background px-4 py-10 text-on-surface">
      <AuthBackdrop />

      <div className="relative z-10 flex w-full max-w-md items-center justify-center">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
