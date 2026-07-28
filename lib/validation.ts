import { z } from "zod";

export const emailSchema = z.string().trim().min(1, "Email is required.").max(254).email("Invalid email address.");

export const nameSchema = z.string().trim().min(1, "Name is required.").max(120, "Name is too long.");

export const shortTextSchema = z.string().trim().max(300).optional().nullable();

export const mediumTextSchema = z.string().trim().max(1000).optional().nullable();

export const messageSchema = z.string().trim().max(2000, "Message is too long (max 2000 characters).").optional().nullable();

export const numAttendeesSchema = z.coerce
  .number()
  .int("Number of attendees must be a whole number.")
  .min(1, "Number of attendees must be at least 1.")
  .max(20, "Number of attendees cannot exceed 20.");

export const priceUsdSchema = z.coerce
  .number()
  .min(1, "Price must be at least $1.")
  .max(100000, "Price cannot exceed $100,000.");

export const totalSpotsSchema = z.coerce
  .number()
  .int("Total spots must be a whole number.")
  .min(1, "Total spots must be at least 1.")
  .max(1000, "Total spots cannot exceed 1000.");

/**
 * Formats the first Zod issue into a short, safe, user-facing message —
 * never echoes raw paths/schema internals back to the client.
 */
export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}
