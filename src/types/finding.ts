/**
 * SPLD SAFETY - Final Project Refactoring
 * Finding Types & Models
 */

export type FindingCategory = 'Unsafe Condition' | 'Unsafe Action' | 'Improvement Opportunity';

export type HazardCategory = 'Physical' | 'Chemical' | 'Biological' | 'Ergonomic' | 'Environmental';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

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
  fileName: string;
  fileSize: number; // in bytes
  fileType: string;
  url: string; // temporary in-memory object URL or preview URL
  uploadedAt: string;
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
  reporterSection: string;

  // Location
  operationalArea: string;
  locationDetail: string;

  // Corrective Action
  correctiveAction?: string;
  dueDate?: string;

  // Status
  status: FindingStatus;

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
  department?: DepartmentOption | 'ALL';
  startDate?: string;
  endDate?: string;
  operationalArea?: string | 'ALL';
}

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
