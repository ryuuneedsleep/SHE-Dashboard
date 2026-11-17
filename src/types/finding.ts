/**
 * SPLD SAFETY - Final Project Refactoring
 * Finding Types & Models
 */

export type FindingCategory =
  | 'UNSAFE_CONDITION'
  | 'UNSAFE_ACTION'
  | 'IMPROVEMENT_OPPORTUNITY'
  | 'Unsafe Condition'
  | 'Unsafe Action'
  | 'Improvement Opportunity';

export type HazardCategory =
  | 'PHYSICAL'
  | 'CHEMICAL'
  | 'BIOLOGICAL'
  | 'ERGONOMIC'
  | 'ENVIRONMENTAL'
  | 'Physical'
  | 'Chemical'
  | 'Biological'
  | 'Ergonomic'
  | 'Environmental';

export type RiskLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical';

export type FindingStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

export type DepartmentOption =
  | 'Warehouse'
  | 'IM'
  | 'SPPM'
  | 'SM'
  | 'QSHE & Jiritsuka'
  | 'Lain-lain';

export interface FindingEvidence {
  id: string;
  findingId?: string;
  blobPathname?: string;
  fileName: string;
  fileSize: number; // in bytes
  fileType: string;
  url: string; // streaming content URL or temporary in-memory object URL
  uploadedAt: string;
  file?: File;
  isPendingUpload?: boolean;
}

export interface FindingStatusHistoryItem {
  id: string;
  findingId: string;
  oldStatus: FindingStatus | null;
  newStatus: FindingStatus;
  note?: string | null;
  changedByAdminId?: string | null;
  changedByName?: string;
  createdAt: string;
}

export interface FindingRecord {
  id: string;
  referenceNo: string;
  title: string;
  description: string;
  findingCategory: FindingCategory;
  hazardCategory?: HazardCategory;
  riskLevel: RiskLevel;
  findingDate: string;

  // Reporter Information (NO Noreg / Employee ID)
  reporterName: string;
  reporterDepartment: DepartmentOption;
  otherDepartmentName?: string;
  reporterOtherDepartment?: string;
  reporterSection: string;
  reporterSectionArea?: string;

  // Location
  operationalArea: string;
  locationDetail: string;

  // Corrective Action
  correctiveAction?: string;
  dueDate?: string;

  // Status & Lifecycle
  status: FindingStatus;
  statusHistory?: FindingStatusHistoryItem[];
  closedAt?: string | null;

  // Evidence
  evidences: FindingEvidence[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
}

export interface CreateFindingInput {
  title: string;
  description: string;
  findingCategory: FindingCategory;
  hazardCategory?: HazardCategory;
  riskLevel: RiskLevel;
  findingDate: string;
  reporterName: string;
  reporterDepartment: DepartmentOption;
  otherDepartmentName?: string;
  reporterSection: string;
  operationalArea: string;
  locationDetail: string;
  correctiveAction?: string;
  dueDate?: string;
  evidences?: FindingEvidence[];
}

export interface UpdateFindingInput extends Partial<CreateFindingInput> {
  status?: FindingStatus;
  isArchived?: boolean;
}

export interface FindingFilters {
  search?: string;
  status?: FindingStatus | 'ALL';
  riskLevel?: RiskLevel | 'ALL';
  findingCategory?: FindingCategory | 'ALL';
  hazardCategory?: HazardCategory | 'ALL';
  department?: DepartmentOption | 'ALL';
  startDate?: string;
  endDate?: string;
  operationalArea?: string | 'ALL';
}

export const FINDING_CATEGORY_OPTIONS = [
  { value: 'UNSAFE_CONDITION', label: 'Unsafe Condition' },
  { value: 'UNSAFE_ACTION', label: 'Unsafe Action' },
  { value: 'IMPROVEMENT_OPPORTUNITY', label: 'Improvement Opportunity' },
] as const;

export const HAZARD_CATEGORY_OPTIONS = [
  { value: 'PHYSICAL', label: 'Physical' },
  { value: 'CHEMICAL', label: 'Chemical' },
  { value: 'BIOLOGICAL', label: 'Biological' },
  { value: 'ERGONOMIC', label: 'Ergonomic' },
  { value: 'ENVIRONMENTAL', label: 'Environmental' },
] as const;

export const RISK_LEVEL_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
] as const;

export const DEPARTMENT_LIST: DepartmentOption[] = [
  'Warehouse',
  'IM',
  'SPPM',
  'SM',
  'QSHE & Jiritsuka',
  'Lain-lain',
];

export const FINDING_CATEGORY_LIST: FindingCategory[] = [
  'Unsafe Condition',
  'Unsafe Action',
  'Improvement Opportunity',
];

export const HAZARD_CATEGORY_LIST: HazardCategory[] = [
  'Physical',
  'Chemical',
  'Biological',
  'Ergonomic',
  'Environmental',
];

export const RISK_LEVEL_LIST: RiskLevel[] = [
  'Low',
  'Medium',
  'High',
  'Critical',
];

export const FINDING_STATUS_LIST: FindingStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'CLOSED',
];

export const OPERATIONAL_AREA_LIST: string[] = [
  'Warehouse Area A',
  'Warehouse Area B',
  'Logistic Dock',
  'Assembly Line 1',
  'Assembly Line 2',
  'Press Shop',
  'Welding Shop',
  'Paint Shop',
  'Quality Inspection Area',
  'Facility & Utilities',
  'Office Area',
];
