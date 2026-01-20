"use server";

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isAdmin } from "./milestones";

/**
 * Konfigurasi S3 Client untuk iDrive E2
 */
const s3Client = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true, // Required untuk S3-compatible storage
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "milestones";

// Konstanta
const MAX_FILE_SIZE = 1000 * 1024; // 1MB
const PRESIGNED_URL_EXPIRES = 3600; // 1 jam dalam detik

// Magic bytes untuk validasi tipe file (mencegah MIME spoofing)
const FILE_SIGNATURES: Record<string, { bytes: number[]; offset?: number }> = {
  "image/jpeg": { bytes: [0xff, 0xd8, 0xff] },
  "image/png": { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  "image/webp": { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF header
};

// Map MIME type ke extension (lebih aman daripada dari filename)
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const ALLOWED_TYPES = Object.keys(MIME_TO_EXT);

export type StorageResult = {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
};

/**
 * Validasi magic bytes file untuk memastikan tipe file benar
 * Mencegah MIME type spoofing attack
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signature = FILE_SIGNATURES[mimeType];
  if (!signature) return false;

  const offset = signature.offset ?? 0;
  const bytes = signature.bytes;

  // Cek apakah buffer cukup panjang
  if (buffer.length < offset + bytes.length) return false;

  // Bandingkan bytes
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[offset + i] !== bytes[i]) return false;
  }

  // Untuk WebP, cek juga "WEBP" di offset 8
  if (mimeType === "image/webp") {
    const webpSignature = [0x57, 0x45, 0x42, 0x50]; // "WEBP"
    if (buffer.length < 12) return false;
    for (let i = 0; i < webpSignature.length; i++) {
      if (buffer[8 + i] !== webpSignature[i]) return false;
    }
  }

  return true;
}

/**
 * Upload gambar milestone ke S3 (private bucket)
 * @param formData - FormData dengan file gambar
 * @returns S3 key untuk disimpan di database
 */
export async function uploadMilestoneImage(
  formData: FormData,
): Promise<StorageResult> {
  // Cek admin
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    return {
      success: false,
      error: "Tidak diizinkan. Diperlukan akses admin.",
    };
  }

  const file = formData.get("image") as File | null;

  if (!file) {
    return {
      success: false,
      error: "File tidak ditemukan",
    };
  }

  // Validasi MIME type dari header (pertahanan pertama)
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Tipe file tidak didukung. Gunakan JPEG, PNG, atau WebP.",
    };
  }

  // Validasi ukuran file
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `Ukuran file terlalu besar (max 1MB). Silakan compress gambar di https://compressjpeg.com/`,
    };
  }

  try {
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validasi magic bytes (pertahanan kedua - mencegah MIME spoofing)
    if (!validateMagicBytes(buffer, file.type)) {
      return {
        success: false,
        error: "File tidak valid. Pastikan file adalah gambar yang benar.",
      };
    }

    // Generate unique filename dengan extension dari MIME type (bukan dari filename)
    const ext = MIME_TO_EXT[file.type] || "jpg";
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const key = `milestones/${timestamp}-${randomStr}.${ext}`;

    // Upload ke S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    // Return key (bukan URL) - presigned URL akan di-generate saat display
    return {
      success: true,
      key,
      url: key, // Simpan key sebagai "url" di database untuk backward compatibility
    };
  } catch (error) {
    // Log error tanpa expose detail ke client
    console.error(
      "Upload error:",
      process.env.NODE_ENV === "development" ? error : "Upload failed",
    );
    return {
      success: false,
      error: "Gagal mengupload gambar. Silakan coba lagi.",
    };
  }
}

/**
 * Generate presigned URL untuk mengakses gambar dari private bucket
 * @param key - S3 key dari gambar
 * @returns Presigned URL yang valid selama 1 jam
 */
export async function getPresignedImageUrl(
  key: string,
): Promise<StorageResult> {
  if (!key) {
    return { success: false, error: "Key tidak valid" };
  }

  // Jika key adalah URL lama (dari sebelum migration), skip
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return { success: true, url: key };
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRES,
    });

    return { success: true, url };
  } catch (error) {
    console.error(
      "Presigned URL error:",
      process.env.NODE_ENV === "development" ? error : "Failed",
    );
    return {
      success: false,
      error: "Gagal mengakses gambar",
    };
  }
}

/**
 * Hapus gambar dari S3
 * @param key - S3 key gambar yang akan dihapus
 */
export async function deleteMilestoneImage(
  key: string,
): Promise<StorageResult> {
  // Cek admin
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    return {
      success: false,
      error: "Tidak diizinkan. Diperlukan akses admin.",
    };
  }

  if (!key) {
    return { success: true }; // Nothing to delete
  }

  // Jika key adalah URL lama, skip delete
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return { success: true };
  }

  try {
    if (!key.startsWith("milestones/")) {
      return { success: true }; // Bukan gambar dari storage kita
    }

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }),
    );

    return { success: true };
  } catch (error) {
    console.error(
      "Delete error:",
      process.env.NODE_ENV === "development" ? error : "Failed",
    );
    return {
      success: false,
      error: "Gagal menghapus gambar",
    };
  }
}
