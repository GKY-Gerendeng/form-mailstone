"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod/v4";
import type {
  Milestone,
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from "@/lib/types/milestones";

/**
 * Result type for milestone actions
 */
export type MilestoneResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Validation schemas
 */
const createMilestoneSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  image_url: z.url().optional().or(z.literal("")),
});

const updateMilestoneSchema = z.object({
  id: z.string().uuid("Invalid milestone ID"),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  image_url: z.url().optional().or(z.literal("")),
});

/**
 * Check if current user is an admin
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
 * Fetch all milestones
 * All authenticated users can read
 */
export async function getMilestones(): Promise<MilestoneResult<Milestone[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .order("event_date", { ascending: false });

  if (error) {
    return {
      success: false,
      error: "Failed to fetch milestones",
    };
  }

  return {
    success: true,
    data: data as Milestone[],
  };
}

/**
 * Get a single milestone by ID
 */
export async function getMilestoneById(
  id: string,
): Promise<MilestoneResult<Milestone>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return {
      success: false,
      error: "Milestone not found",
    };
  }

  return {
    success: true,
    data: data as Milestone,
  };
}

/**
 * Create a new milestone
 * Admin only
 */
export async function createMilestone(
  input: CreateMilestoneInput,
): Promise<MilestoneResult<Milestone>> {
  // Check admin status first
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    return {
      success: false,
      error: "Unauthorized. Admin access required.",
    };
  }

  // Validate input
  const validation = createMilestoneSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid input",
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
      error: "Failed to create milestone",
    };
  }

  return {
    success: true,
    data: data as Milestone,
  };
}

/**
 * Update an existing milestone
 * Admin only
 */
export async function updateMilestone(
  input: UpdateMilestoneInput,
): Promise<MilestoneResult<Milestone>> {
  // Check admin status first
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    return {
      success: false,
      error: "Unauthorized. Admin access required.",
    };
  }

  // Validate input
  const validation = updateMilestoneSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid input",
    };
  }

  const supabase = await createClient();

  // Build update object with only provided fields
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
      error: "Failed to update milestone",
    };
  }

  return {
    success: true,
    data: data as Milestone,
  };
}

/**
 * Delete a milestone
 * Admin only
 */
export async function deleteMilestone(
  id: string,
): Promise<MilestoneResult<void>> {
  // Check admin status first
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    return {
      success: false,
      error: "Unauthorized. Admin access required.",
    };
  }

  // Validate ID
  const idValidation = z.string().uuid().safeParse(id);
  if (!idValidation.success) {
    return {
      success: false,
      error: "Invalid milestone ID",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("milestones").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      error: "Failed to delete milestone",
    };
  }

  return {
    success: true,
  };
}
