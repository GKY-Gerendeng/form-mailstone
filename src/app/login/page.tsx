import { Suspense } from "react";
import { LoginForm } from "@/components/organism/login-form";

/**
 * Loading fallback for login form
 */
function LoginFormSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex flex-col items-center gap-4">
        <div className="size-8 rounded-md bg-muted" />
        <div className="h-6 w-48 rounded bg-muted" />
      </div>
      <div className="h-10 w-full rounded-md bg-muted" />
      <div className="h-10 w-full rounded-md bg-muted" />
      <div className="h-10 w-full rounded-md bg-muted" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
