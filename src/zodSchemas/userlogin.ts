import { z } from 'zod';

// Email/Password Login Schema
export const userLoginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
});

// Phone/OTP Login Schema
export const phoneLoginSchema = z.object({
  phoneNumber: z.string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
  otp: z.string()
    .min(6, 'OTP must be 6 digits')
    .max(6, 'OTP must be 6 digits')
    .optional() // Optional initially, required when verifying
});

export type UserLogin = z.infer<typeof userLoginSchema>;
export type PhoneLogin = z.infer<typeof phoneLoginSchema>;