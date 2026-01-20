"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GalleryVerticalEnd, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/shadcn/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/shadcn/field";
import { Input } from "@/components/shadcn/input";
import { signInWithGoogle, signInWithOTP } from "@/lib/actions/auth";

/**
 * Pesan error untuk kesalahan autentikasi
 */
const ERROR_MESSAGES: Record<string, string> = {
  signup_disabled:
    "Pendaftaran tidak dibuka. Silakan hubungi administrator jika Anda memerlukan akses.",
  auth_callback_error: "Terjadi kesalahan saat login. Silakan coba lagi.",
};

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPendingOTP, startOTPTransition] = useTransition();
  const [isPendingGoogle, startGoogleTransition] = useTransition();

  const isLoading = isPendingOTP || isPendingGoogle;

  // Periksa error di URL params atau hash (dari callback OAuth)
  // Supabase OAuth mengembalikan error di URL hash fragment (setelah #)
  useEffect(() => {
    // Pertama periksa query params
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const errorMessage =
        ERROR_MESSAGES[errorParam] || ERROR_MESSAGES.auth_callback_error;
      setError(errorMessage);

      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
      return;
    }

    // Periksa URL hash (Supabase OAuth mengembalikan error di hash fragment)
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashError = hashParams.get("error");
      const errorCode = hashParams.get("error_code");

      if (hashError || errorCode) {
        // Periksa error signup disabled
        if (
          errorCode === "signup_disabled" ||
          hashError === "access_denied" ||
          errorCode?.includes("signup")
        ) {
          setError(ERROR_MESSAGES.signup_disabled);
        } else {
          setError(ERROR_MESSAGES.auth_callback_error);
        }

        // Bersihkan URL hash
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [searchParams]);

  /**
   * Menangani login Google OAuth
   * Catatan: signInWithGoogle menggunakan redirect() yang melempar NEXT_REDIRECT
   * Ini adalah perilaku yang diharapkan dan tidak boleh ditangkap sebagai error
   */
  const handleGoogleSignIn = () => {
    setError(null);
    startGoogleTransition(async () => {
      try {
        await signInWithGoogle();
      } catch (err) {
        // NEXT_REDIRECT dilempar oleh redirect() - ini diharapkan, bukan error
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
          return;
        }
        setError(
          err instanceof Error ? err.message : "Gagal login dengan Google",
        );
      }
    });
  };

  /**
   * Menangani login Email OTP
   */
  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startOTPTransition(async () => {
      const result = await signInWithOTP(email);

      if (result.success) {
        // Redirect ke halaman OTP - email disimpan di HTTP-only cookie yang aman
        router.push("/otp");
      } else {
        setError(result.error || "Gagal mengirim kode verifikasi");
      }
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleEmailSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Image src="/logo.svg" alt="Logo" width={100} height={100} />
            <h1 className="text-xl font-bold">GKY Gerendeng Journey</h1>
          </div>

          {/* Pesan Error */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
              {error}
            </div>
          )}

          <Field className="grid gap-4 sm:grid-cols-1">
            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isPendingGoogle ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="mr-2 size-4"
                >
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
              )}
              Lanjutkan dengan Google
            </Button>
          </Field>

          <FieldSeparator>Atau</FieldSeparator>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />
          </Field>

          <Field>
            <Button type="submit" disabled={isLoading || !email}>
              {isPendingOTP ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Mengirim kode...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </Field>
        </FieldGroup>
      </form>

      <FieldDescription className="px-6 text-center">
        Dengan mengklik lanjutkan, Anda menyetujui{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Ketentuan Layanan
        </a>{" "}
        dan{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Kebijakan Privasi
        </a>{" "}
        kami.
      </FieldDescription>
    </div>
  );
}
