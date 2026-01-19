import { z } from "zod/v4";

/**
 * Email validation schema with proper format checking
 */
export const emailSchema = z
  .email("Please enter a valid email address")
  .min(1, "Email is required");

/**
 * OTP token validation schema
 * Ensures exactly 6 digits
 */
export const otpTokenSchema = z
  .string()
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^\d+$/, "OTP must contain only numbers");

/**
 * Type definitions for auth forms
 */
export type EmailInput = z.infer<typeof emailSchema>;
export type OTPTokenInput = z.infer<typeof otpTokenSchema>;
