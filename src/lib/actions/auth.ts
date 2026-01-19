"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, otpTokenSchema } from "@/lib/validations/auth";

/**
 * Result type for authentication actions
 */
export type AuthResult = {
  success: boolean;
  error?: string;
  message?: string;
};

/**
 * OTP Session cookie configuration
 * Using HTTP-only cookie to securely store email for OTP verification
 */
const OTP_SESSION_COOKIE = "otp_session";
const OTP_SESSION_MAX_AGE = 600; // 10 minutes

/**
 * Gets the current site URL for redirects
 * Handles both production and development environments
 */
function getSiteUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/**
 * Initiates Google OAuth sign-in flow
 * Redirects user to Google OAuth consent screen
 */
export async function signInWithGoogle(): Promise<never> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.url) {
    redirect(data.url);
  }

  throw new Error("Failed to get OAuth URL");
}

/**
 * Sends OTP to user's email address
 * Stores email in HTTP-only cookie for secure retrieval
 *
 * @param email - User's email address
 * @returns Result object with success status
 */
export async function signInWithOTP(email: string): Promise<AuthResult> {
  const validationResult = emailSchema.safeParse(email);

  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.issues[0]?.message || "Invalid email",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: validationResult.data,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("signups not allowed") ||
      error.message.toLowerCase().includes("signup") ||
      error.message.toLowerCase().includes("user not found") ||
      (error.message.toLowerCase().includes("otp") &&
        error.message.toLowerCase().includes("disabled"))
    ) {
      return {
        success: false,
        error:
          "Pendaftaran tidak dibuka. Silakan hubungi administrator jika Anda memerlukan akses.",
      };
    }

    if (error.message.includes("rate limit")) {
      return {
        success: false,
        error: "Too many requests. Please wait a moment before trying again.",
      };
    }

    return {
      success: false,
      error: error.message,
    };
  }

  // Store email in HTTP-only cookie for OTP verification
  const cookieStore = await cookies();
  cookieStore.set(OTP_SESSION_COOKIE, validationResult.data, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OTP_SESSION_MAX_AGE,
    path: "/",
  });

  return {
    success: true,
    message: "Verification code sent to your email",
  };
}

/**
 * Gets the email from OTP session cookie
 * Returns null if no session exists
 */
export async function getOTPSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(OTP_SESSION_COOKIE);
  return session?.value || null;
}

/**
 * Clears the OTP session cookie
 */
async function clearOTPSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OTP_SESSION_COOKIE);
}

/**
 * Verifies OTP code entered by user
 * Uses email from secure HTTP-only cookie
 *
 * @param token - 6-digit OTP code
 * @returns Result object with success status
 */
export async function verifyOTP(token: string): Promise<AuthResult> {
  // Get email from secure cookie
  const email = await getOTPSessionEmail();

  if (!email) {
    return {
      success: false,
      error: "Session expired. Please request a new verification code.",
    };
  }

  const tokenResult = otpTokenSchema.safeParse(token);

  if (!tokenResult.success) {
    return {
      success: false,
      error:
        tokenResult.error.issues[0]?.message || "Invalid verification code",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token: tokenResult.data,
    type: "email",
  });

  if (error) {
    if (error.message.includes("expired")) {
      return {
        success: false,
        error: "Verification code has expired. Please request a new one.",
      };
    }

    if (error.message.includes("invalid")) {
      return {
        success: false,
        error: "Invalid verification code. Please check and try again.",
      };
    }

    return {
      success: false,
      error: error.message,
    };
  }

  // Clear OTP session on successful verification
  await clearOTPSession();

  return {
    success: true,
    message: "Successfully verified",
  };
}

/**
 * Signs out the current user and redirects to login
 */
export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Gets the current authenticated user
 * Returns null if not authenticated
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
