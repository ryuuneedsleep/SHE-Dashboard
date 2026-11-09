/**
 * SPLD SAFETY - Safety Management System
 * Module 01: Form Validation Schemas using Zod
 */

import { z } from 'zod';

// Indonesian mobile phone regex supporting formats like 08..., +628..., 628...
const PHONE_REGEX = /^(?:\+62|62|0)8[1-9][0-9]{6,11}$/;

export const registrationSchema = z
  .object({
    // Section A: Personal Information
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters'),
    noreg: z
      .string()
      .trim()
      .min(3, 'Employee number (Noreg) must be at least 3 characters')
      .max(20, 'Employee number cannot exceed 20 characters'),
    phone: z
      .string()
      .trim()
      .regex(
        PHONE_REGEX,
        'Enter a valid Indonesian mobile number (e.g., 081234567890 or +6281234567890)'
      ),
    email: z
      .string()
      .trim()
      .email('Please enter a valid corporate or official email address')
      .max(120, 'Email address cannot exceed 120 characters'),

    // Section B: Work Information
    department: z
      .string()
      .trim()
      .min(1, 'Please select a valid department'),
    otherDepartmentName: z.string().trim().optional(),
    section: z
      .string()
      .trim()
      .min(1, 'Please select or specify a Section / Area'),
    position: z
      .string()
      .trim()
      .min(1, 'Please select a Position / Jabatan'),
    otherPositionName: z.string().trim().optional(),

    // Section C: Account Security
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
      .regex(/[0-9]/, 'Password must include at least one number')
      .regex(
        /[^a-zA-Z0-9]/,
        'Password must include at least one special character (!@#$%^&*...)'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),

    // Section D: Agreement
    agreement: z.boolean().refine((val) => val === true, {
      message: 'You must confirm and accept the terms and conditions to proceed',
    }),
  })
  .superRefine((data, ctx) => {
    // If department is "Lain-lain", otherDepartmentName is mandatory
    if (data.department === 'Lain-lain') {
      if (!data.otherDepartmentName || data.otherDepartmentName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['otherDepartmentName'],
          message: 'Please specify your department name',
        });
      }
    }

    // If position is "Other", otherPositionName is mandatory
    if (data.position === 'Other') {
      if (!data.otherPositionName || data.otherPositionName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['otherPositionName'],
          message: 'Please specify your position title',
        });
      }
    }

    // Passwords must match
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }
  });

export type RegistrationFormValues = z.infer<typeof registrationSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid corporate email address'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
