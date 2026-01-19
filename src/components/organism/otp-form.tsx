"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GalleryVerticalEnd, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/shadcn/button";
import { Field, FieldDescription, FieldGroup } from "@/components/shadcn/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/shadcn/input-otp";
import {
  verifyOTP,
  signInWithOTP,
  getOTPSessionEmail,
} from "@/lib/actions/auth";

interface OTPFormProps extends React.ComponentProps<"div"> {
  initialEmail?: string;
}

export function OTPForm({ className, initialEmail, ...props }: OTPFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPendingVerify, startVerifyTransition] = useTransition();
  const [isPendingResend, startResendTransition] = useTransition();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(!initialEmail);

  const isPending = isPendingVerify || isPendingResend;

  // Fetch email from server if not provided
  useEffect(() => {
    if (!initialEmail) {
      getOTPSessionEmail().then((sessionEmail) => {
        if (sessionEmail) {
          setEmail(sessionEmail);
        }
        setIsLoading(false);
      });
    }
  }, [initialEmail]);

  /**
   * Mask email for display (security)
   */
  const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : "";

  /**
   * Starts the cooldown timer for resend button
   */
  const startCooldown = useCallback(() => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  /**
   * Handles OTP verification
   */
  const handleVerify = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Session expired. Please go back and request a new code.");
      return;
    }

    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    startVerifyTransition(async () => {
      const result = await verifyOTP(otp);

      if (result.success) {
        setSuccess("Verification successful! Redirecting...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 500);
      } else {
        setError(result.error || "Verification failed");
        setOtp("");
      }
    });
  };

  /**
   * Handles resending OTP code
   */
  const handleResend = () => {
    if (!email || resendCooldown > 0) return;

    setError(null);
    setSuccess(null);
    setOtp("");

    startResendTransition(async () => {
      const result = await signInWithOTP(email);

      if (result.success) {
        setSuccess("New verification code sent to your email");
        startCooldown();
      } else {
        setError(result.error || "Failed to resend code");
      }
    });
  };

  /**
   * Handle OTP input change
   */
  const handleOTPChange = (value: string) => {
    setOtp(value);
    setError(null);
  };

  // Loading state while fetching email
  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // No email found
  if (!email) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground">
            Session expired or no email found. Please go back to login.
          </p>
          <Button onClick={() => router.push("/login")}>Back to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleVerify}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">GKY Gerendeng</span>
            </a>
            <h1 className="text-xl font-bold">Enter verification code</h1>
            <FieldDescription>
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{maskedEmail}</span>
            </FieldDescription>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="rounded-md bg-green-500/10 p-3 text-center text-sm text-green-600 dark:text-green-400">
              {success}
            </div>
          )}

          <Field>
            <InputOTP
              maxLength={6}
              id="otp"
              value={otp}
              onChange={handleOTPChange}
              disabled={isPending}
              containerClassName="gap-4 justify-center"
            >
              <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <FieldDescription className="text-center">
              Didn&apos;t receive the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isPending}
                className="text-primary underline underline-offset-4 hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPendingResend
                  ? "Sending..."
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend"}
              </button>
            </FieldDescription>
          </Field>

          <Field>
            <Button type="submit" disabled={isPending || otp.length !== 6}>
              {isPendingVerify ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </Field>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              ← Back to login
            </button>
          </div>
        </FieldGroup>
      </form>

      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </a>
        .
      </FieldDescription>
    </div>
  );
}
