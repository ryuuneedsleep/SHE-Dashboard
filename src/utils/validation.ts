/**
 * SPLD SAFETY - Final Project Refactoring
 * Form Validation Schemas using Zod
 */

import { z } from 'zod';
import {
  DEPARTMENT_LIST,
  FINDING_STATUS_LIST,
} from '../types/finding.ts';

const PHONE_REGEX = /^(?:\+62|62|0)8[1-9][0-9]{6,11}$/;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(1, 'Password wajib diisi'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const findingFormSchema = z
  .object({
    // Reporter Information
    reporterName: z
      .string()
      .trim()
      .min(2, 'Nama pelapor minimal 2 karakter')
      .max(100, 'Nama pelapor maksimal 100 karakter'),
    reporterDepartment: z.enum(
      DEPARTMENT_LIST as [string, ...string[]],
      { error: 'Pilih departemen pelapor yang valid' }
    ),
    otherDepartmentName: z.string().trim().optional(),
    reporterSection: z
      .string()
      .trim()
      .min(2, 'Section / Area pelapor minimal 2 karakter')
      .max(100, 'Section pelapor maksimal 100 karakter'),

    // Finding Information
    title: z
      .string()
      .trim()
      .min(3, 'Judul temuan minimal 3 karakter')
      .max(150, 'Judul temuan maksimal 150 karakter'),
    description: z
      .string()
      .trim()
      .min(5, 'Deskripsi temuan minimal 5 karakter'),
    findingCategory: z.enum(
      [
        'UNSAFE_CONDITION',
        'UNSAFE_ACTION',
        'IMPROVEMENT_OPPORTUNITY',
        'Unsafe Condition',
        'Unsafe Action',
        'Improvement Opportunity',
      ] as [string, ...string[]],
      { error: 'Pilih kategori temuan yang valid' }
    ),
    hazardCategory: z
      .enum([
        'PHYSICAL',
        'CHEMICAL',
        'BIOLOGICAL',
        'ERGONOMIC',
        'ENVIRONMENTAL',
        'Physical',
        'Chemical',
        'Biological',
        'Ergonomic',
        'Environmental',
      ] as [string, ...string[]])
      .optional()
      .or(z.literal('')),
    riskLevel: z.enum(
      [
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL',
        'Low',
        'Medium',
        'High',
        'Critical',
      ] as [string, ...string[]],
      { error: 'Pilih tingkat risiko yang valid' }
    ),
    findingDate: z
      .string()
      .min(1, 'Tanggal temuan wajib diisi'),

    // Location
    operationalArea: z
      .string()
      .trim()
      .min(2, 'Area operasional wajib diisi'),
    locationDetail: z
      .string()
      .trim()
      .min(2, 'Detail lokasi temuan wajib diisi'),

    // Corrective Action
    correctiveAction: z.string().trim().optional(),
    dueDate: z.string().optional(),

    // Status (used in edit form)
    status: z
      .enum(FINDING_STATUS_LIST as [string, ...string[]])
      .optional(),
  })
  .refine(
    (data) => {
      if (data.reporterDepartment === 'Lain-lain') {
        return !!data.otherDepartmentName && data.otherDepartmentName.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Nama departemen lain wajib diisi jika memilih "Lain-lain"',
      path: ['otherDepartmentName'],
    }
  );

export type FindingFormData = z.infer<typeof findingFormSchema>;

export const profileFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama minimal 2 karakter'),
  email: z
    .string()
    .trim()
    .email('Format email tidak valid'),
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, 'Nomor handphone tidak valid (contoh: 081234567890)'),
  position: z
    .string()
    .trim()
    .min(2, 'Jabatan wajib diisi'),
  department: z
    .string()
    .trim()
    .min(2, 'Departemen wajib diisi'),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;
