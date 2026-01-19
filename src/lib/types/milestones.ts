/**
 * Milestone type definitions
 * Represents internal records for events, activities, etc.
 */

export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  event_date: string; // ISO date string
  image_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/**
 * Input type for creating a new milestone
 */
export interface CreateMilestoneInput {
  title: string;
  description?: string;
  event_date: string;
  image_url?: string;
}

/**
 * Input type for updating an existing milestone
 */
export interface UpdateMilestoneInput {
  id: string;
  title?: string;
  description?: string;
  event_date?: string;
  image_url?: string;
}
