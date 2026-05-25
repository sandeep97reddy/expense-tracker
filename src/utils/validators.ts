/**
 * Zod validation schemas
 * Reusable validators for common data types.
 */

import { z } from 'zod';

/** Email validation */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(1, 'Email is required');

/** Amount validation (positive number) */
export const amountSchema = z
  .number()
  .positive('Amount must be positive')
  .max(99999999, 'Amount is too large');

/** UPI ID validation */
export const upiIdSchema = z
  .string()
  .min(1, 'UPI ID is required')
  .regex(
    /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/,
    'Invalid UPI ID format (e.g., name@bank)',
  );

/** Transaction title */
export const titleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(100, 'Title must be under 100 characters');

/** Note/description */
export const noteSchema = z
  .string()
  .max(500, 'Note must be under 500 characters')
  .optional();

/** Tag validation */
export const tagSchema = z
  .string()
  .min(1)
  .max(30, 'Tag must be under 30 characters');

/** Date string validation (ISO 8601) */
export const dateSchema = z
  .string()
  .datetime({ message: 'Invalid date format' });

/** Password validation (for future use) */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number');
