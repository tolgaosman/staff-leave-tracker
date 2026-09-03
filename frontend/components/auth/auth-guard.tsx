"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { useAuth } from "@/components/auth/auth-provider";

/* Client-side route guard for the dashboard group. Static export can't
   run server middleware, so protection happens here after hydration. */

// Hydration flag without setState-in-effect: false during SSR/hydration,
// true once running on the client.
const emptySubscribe = () => () => {};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    if (mounted && !user) {
      router.replace("/login");
    }
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
          Yönlendiriliyor…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
