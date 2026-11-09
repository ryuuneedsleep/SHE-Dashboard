/**
 * SPLD SAFETY - Master Data Configuration
 * Bridges legacy configurations to the centralized MasterDataService (Single Source of Truth).
 */

import type { StandardDepartment, StandardPosition, MasterItem, AppRole } from '../types/auth';
import { masterDataService } from '../services/masterDataService.ts';

/**
 * Standard department options (6 standard options)
 */
export const DEPARTMENT_OPTIONS: { value: StandardDepartment; label: string }[] = [
  { value: 'Warehouse', label: 'Warehouse' },
  { value: 'IM', label: 'IM (Inventory Management)' },
  { value: 'SPPM', label: 'SPPM (Service Parts Planning & Management)' },
  { value: 'SM', label: 'SM (Supply Management)' },
  { value: 'QSHE & Jiritsuka', label: 'QSHE & Jiritsuka' },
  { value: 'Lain-lain', label: 'Lain-lain (Other)' },
];

/**
 * Dynamic helper to retrieve active department options from centralized service
 */
export const getActiveDepartmentOptions = () =>
  masterDataService.getActiveDepartments().map((d) => ({
    value: d.name as StandardDepartment,
    label: d.name,
    code: d.code,
    id: d.id,
  }));

/**
 * Configurable Operational Areas
 */
export const OPERATIONAL_AREAS: MasterItem[] = [
  { id: 'sec-rec', name: 'Receiving & Inbound Area' },
  { id: 'sec-sto', name: 'Storage & Stacking Zone' },
  { id: 'sec-pic', name: 'Picking & Sorting Line' },
  { id: 'sec-pac', name: 'Packing & Final Assembly' },
  { id: 'sec-shi', name: 'Shipping & Outbound Area' },
  { id: 'sec-inv', name: 'Inventory Audit & Cycle Count' },
  { id: 'sec-qshe', name: 'Safety & Environmental Control (QSHE)' },
  { id: 'sec-jrk', name: 'Jiritsuka & Kaizen Area' },
  { id: 'sec-adm', name: 'Office & Logistics Administration' },
  { id: 'sec-oth', name: 'Other Section / Area' },
];

export const SAMPLE_SECTION_OPTIONS: MasterItem[] = OPERATIONAL_AREAS;

/**
 * Configurable Position / Jabatan options
 */
export const POSITION_OPTIONS: { value: StandardPosition; label: string }[] = [
  { value: 'Operator', label: 'Operator' },
  { value: 'Staff', label: 'Staff' },
  { value: 'Group Head', label: 'Group Head' },
  { value: 'Line Head', label: 'Line Head' },
  { value: 'Section Head', label: 'Section Head' },
  { value: 'Department Head / Manager', label: 'Department Head / Manager' },
  { value: 'Other', label: 'Other (Lainnya)' },
];

/**
 * Role Definitions (4 roles, no SUPER_ADMIN)
 */
export interface RoleConfig {
  role: AppRole;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
}

export const ROLE_CONFIGS: Record<AppRole, RoleConfig> = {
  QSHE_ADMIN: {
    role: 'QSHE_ADMIN',
    label: 'QSHE Admin',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-700 font-bold',
    badgeBorder: 'border-red-300',
    description:
      'Super Admin-level privileges: User & Role management, registration approvals, area access governance, and audit logging.',
  },
  APPROVER: {
    role: 'APPROVER',
    label: 'Approver / Leader',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700 font-semibold',
    badgeBorder: 'border-blue-300',
    description:
      'Section & Group Leader privileges: Safety incident reviews, corrective action plan sign-offs within assigned areas.',
  },
  MEMBER: {
    role: 'MEMBER',
    label: 'Member / Reporter',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-700 font-medium',
    badgeBorder: 'border-gray-300',
    description:
      'Standard division member: Hazard identification, near-miss reporting, and 5S checklists in assigned areas.',
  },
  MANAGEMENT: {
    role: 'MANAGEMENT',
    label: 'Management',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700 font-semibold',
    badgeBorder: 'border-purple-300',
    description:
      'Executive & Department leadership oversight: Division-wide safety KPI dashboards, compliance reports, and incident trends.',
  },
};

export const ROLE_OPTIONS: { value: AppRole; label: string; description: string }[] = [
  {
    value: 'MEMBER',
    label: ROLE_CONFIGS.MEMBER.label,
    description: ROLE_CONFIGS.MEMBER.description,
  },
  {
    value: 'APPROVER',
    label: ROLE_CONFIGS.APPROVER.label,
    description: ROLE_CONFIGS.APPROVER.description,
  },
  {
    value: 'MANAGEMENT',
    label: ROLE_CONFIGS.MANAGEMENT.label,
    description: ROLE_CONFIGS.MANAGEMENT.description,
  },
  {
    value: 'QSHE_ADMIN',
    label: ROLE_CONFIGS.QSHE_ADMIN.label,
    description: ROLE_CONFIGS.QSHE_ADMIN.description,
  },
];

export const REGISTRATION_AGREEMENT_TEXT =
  'I confirm that the information provided is accurate and agree to comply with the SPLD SAFETY application terms and conditions.';
