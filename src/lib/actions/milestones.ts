"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod/v4";
import type {
  Milestone,
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from "@/lib/types/milestones";

/**
 * Tipe hasil untuk aksi milestone
 */
export type MilestoneResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Schema validasi untuk membuat milestone
 * image_url sekarang menyimpan S3 key (bukan URL), presigned URL di-generate saat fetch
 */
const createMilestoneSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200),
  description: z.string().max(2000).optional(),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid"),
  image_url: z.string().optional(),
});

/**
 * Schema validasi untuk update milestone
 */
const updateMilestoneSchema = z.object({
  id: z.string().uuid("ID milestone tidak valid"),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  image_url: z.string().optional(),
});

/**
 * Memeriksa apakah user saat ini adalah admin
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return !!admin;
}

/**
 * Mengambil semua milestone
 * Semua user terautentikasi dapat membaca
 * Gambar akan di-resolve ke presigned URL untuk private bucket
 */
export async function getMilestones(): Promise<MilestoneResult<Milestone[]>> {
  const supabase = await createClient();
  const { getPresignedImageUrl } = await import("./storage");

  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .order("event_date", { ascending: false });

  if (error) {
    return {
      success: false,
      error: "Gagal mengambil milestone",
    };
  }

  // Generate presigned URLs untuk semua gambar
  const milestonesWithUrls = await Promise.all(
    (data as Milestone[]).map(async (milestone) => {
      if (milestone.image_url) {
        const result = await getPresignedImageUrl(milestone.image_url);
        if (result.success && result.url) {
          return { ...milestone, image_url: result.url };
        }
      }
      return milestone;
    }),
  );

  return {
    success: true,
    data: milestonesWithUrls,
  };
}

/**
 * Mengambil satu milestone berdasarkan ID
 * Gambar akan di-resolve ke presigned URL untuk private bucket
 */
export async function getMilestoneById(
  id: string,
): Promise<MilestoneResult<Milestone>> {
  const supabase = await createClient();
  const { getPresignedImageUrl } = await import("./storage");

  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return {
      success: false,
      error: "Journey tidak ditemukan",
    };
  }

  let milestone = data as Milestone;

  // Generate presigned URL untuk gambar
  if (milestone.image_url) {
    const result = await getPresignedImageUrl(milestone.image_url);
    if (result.success && result.url) {
      milestone = { ...milestone, image_url: result.url };
    }
  }

  return {
    success: true,
    data: milestone,
  };
}

/**
 * Membuat milestone baru
 * Hanya admin yang bisa mengakses
 */
export async function createMilestone(
  input: CreateMilestoneInput,
): Promise<MilestoneResult<Milestone>> {
  // Periksa status admin terlebih dahulu
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    return {
      success: false,
      error: "Tidak diizinkan. Diperlukan akses admin.",
    };
  }

  // Validasi input
  const validation = createMilestoneSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Input tidak valid",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("milestones")
    .insert({
      title: validation.data.title,
      description: validation.data.description || null,
      event_date: validation.data.event_date,
      image_url: validation.data.image_url || null,
      created_by: user?.id,
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: "Gagal membuat milestone",
    };
  }

  return {
    success: true,
    data: data as Milestone,
  };
}

/**
 * Memperbarui milestone yang ada
 * Hanya admin yang bisa mengakses
 */
export async function updateMilestone(
  input: UpdateMilestoneInput,
): Promise<MilestoneResult<Milestone>> {
  // Periksa status admin terlebih dahulu
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    return {
      success: false,
      error: "Tidak diizinkan. Diperlukan akses admin.",
    };
  }

  // Validasi input
  const validation = updateMilestoneSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Input tidak valid",
    };
  }

  const supabase = await createClient();

  // Bangun objek update hanya dengan field yang disediakan
  const updateData: Record<string, unknown> = {};
  if (validation.data.title) updateData.title = validation.data.title;
  if (validation.data.description !== undefined)
    updateData.description = validation.data.description || null;
  if (validation.data.event_date)
    updateData.event_date = validation.data.event_date;
  if (validation.data.image_url !== undefined)
    updateData.image_url = validation.data.image_url || null;

  const { data, error } = await supabase
    .from("milestones")
    .update(updateData)
    .eq("id", validation.data.id)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: "Gagal memperbarui milestone",
    };
  }

  return {
    success: true,
    data: data as Milestone,
  };
}

/**
 * Menghapus milestone
 * Hanya admin yang bisa mengakses
 */
export async function deleteMilestone(
  id: string,
): Promise<MilestoneResult<void>> {
  // Periksa status admin terlebih dahulu
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    return {
      success: false,
      error: "Tidak diizinkan. Diperlukan akses admin.",
    };
  }

  // Validasi ID
  const idValidation = z.string().uuid().safeParse(id);
  if (!idValidation.success) {
    return {
      success: false,
      error: "ID milestone tidak valid",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("milestones").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      error: "Gagal menghapus milestone",
    };
  }

  return {
    success: true,
  };
}
