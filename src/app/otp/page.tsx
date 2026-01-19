import { Suspense } from "react";
import { OTPForm } from "@/components/organism/otp-form";

/**
 * Loading fallback for OTP verification page
 */
function OTPFormSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex flex-col items-center gap-4">
        <div className="size-8 rounded-md bg-muted" />
        <div className="h-6 w-48 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>
      <div className="flex justify-center gap-4">
        <div className="flex gap-2.5">
          <div className="h-16 w-12 rounded-md bg-muted" />
          <div className="h-16 w-12 rounded-md bg-muted" />
          <div className="h-16 w-12 rounded-md bg-muted" />
        </div>
        <div className="self-center">—</div>
        <div className="flex gap-2.5">
          <div className="h-16 w-12 rounded-md bg-muted" />
          <div className="h-16 w-12 rounded-md bg-muted" />
          <div className="h-16 w-12 rounded-md bg-muted" />
        </div>
      </div>
      <div className="h-10 w-full rounded-md bg-muted" />
    </div>
  );
}

export default function OTPPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<OTPFormSkeleton />}>
          <OTPForm />
        </Suspense>
      </div>
    </div>
  );
}
