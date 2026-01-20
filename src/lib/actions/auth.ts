"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, otpTokenSchema } from "@/lib/validations/auth";

/**
 * Tipe hasil untuk aksi autentikasi
 */
export type AuthResult = {
  success: boolean;
  error?: string;
  message?: string;
};

/**
 * Konfigurasi cookie sesi OTP
 * Menggunakan HTTP-only cookie untuk menyimpan email dengan aman
 */
const OTP_SESSION_COOKIE = "otp_session";
const OTP_SESSION_MAX_AGE = 600; // 10 menit

/**
 * Mendapatkan URL situs untuk redirect
 * Menangani environment production dan development
 *
 * PENTING: Prioritaskan NEXT_PUBLIC_SITE_URL untuk custom domain
 * karena VERCEL_URL berisi domain internal Vercel (xxx.vercel.app)
 * yang tidak terdaftar di Supabase Redirect URLs
 */
function getSiteUrl(): string {
  // Prioritaskan custom domain dari env var
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // Fallback ke Vercel URL (untuk preview deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/**
 * Memulai alur login Google OAuth
 * Mengarahkan user ke halaman consent Google
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

  throw new Error("Gagal mendapatkan URL OAuth");
}

/**
 * Mengirim OTP ke alamat email user
 * Menyimpan email di HTTP-only cookie untuk pengambilan yang aman
 *
 * @param email - Alamat email user
 * @returns Objek hasil dengan status sukses
 */
export async function signInWithOTP(email: string): Promise<AuthResult> {
  const validationResult = emailSchema.safeParse(email);

  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.issues[0]?.message || "Email tidak valid",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: validationResult.data,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    // Pendaftaran ditutup atau user tidak ditemukan
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
        error: "Terlalu banyak permintaan. Silakan tunggu sebentar.",
      };
    }

    return {
      success: false,
      error: error.message,
    };
  }

  // Simpan email di HTTP-only cookie untuk verifikasi OTP
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
    message: "Kode verifikasi telah dikirim ke email Anda",
  };
}

/**
 * Mendapatkan email dari cookie sesi OTP
 * Mengembalikan null jika tidak ada sesi
 */
export async function getOTPSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(OTP_SESSION_COOKIE);
  return session?.value || null;
}

/**
 * Menghapus cookie sesi OTP
 */
async function clearOTPSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OTP_SESSION_COOKIE);
}

/**
 * Memverifikasi kode OTP yang dimasukkan user
 * Menggunakan email dari HTTP-only cookie yang aman
 *
 * @param token - Kode OTP 6 digit
 * @returns Objek hasil dengan status sukses
 */
export async function verifyOTP(token: string): Promise<AuthResult> {
  // Ambil email dari cookie aman
  const email = await getOTPSessionEmail();

  if (!email) {
    return {
      success: false,
      error: "Sesi berakhir. Silakan minta kode verifikasi baru.",
    };
  }

  const tokenResult = otpTokenSchema.safeParse(token);

  if (!tokenResult.success) {
    return {
      success: false,
      error:
        tokenResult.error.issues[0]?.message || "Kode verifikasi tidak valid",
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
        error: "Kode verifikasi telah kadaluarsa. Silakan minta kode baru.",
      };
    }

    if (error.message.includes("invalid")) {
      return {
        success: false,
        error: "Kode verifikasi salah. Silakan periksa dan coba lagi.",
      };
    }

    return {
      success: false,
      error: error.message,
    };
  }

  // Hapus sesi OTP setelah verifikasi berhasil
  await clearOTPSession();

  return {
    success: true,
    message: "Verifikasi berhasil",
  };
}

/**
 * Logout user dan redirect ke halaman login
 */
export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Mendapatkan user yang sedang terautentikasi
 * Mengembalikan null jika tidak terautentikasi
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
