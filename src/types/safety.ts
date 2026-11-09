/**
 * SPLD SAFETY - Module 05: Safety Patrol & Finding Management Type Definitions
 * Service Parts Logistic Division (SPLD)
 */

import type { AppRole } from './auth';

export type FindingSource = 'DIRECT' | 'PATROL';

export type FindingLifecycleStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Accepted'
  | 'In Progress'
  | 'Resolved'
  | 'Closed'
  | 'Rejected';

export type PatrolLifecycleStatus =
  | 'Planned'
  | 'Assigned'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export type ChecklistItemStatus = 'UNCHECKED' | 'OK' | 'NOT_OK' | 'NA';

export interface FindingEvidence {
  fileName: string;
  fileSize: number; // in bytes
  fileType: string;
  previewUrl: string; // Base64 Data URL or public asset path
  uploadedAt: string;
}

export interface FindingReviewEntry {
  id: string;
  timestamp: string; // ISO 8601
  actorNoreg: string;
  actorName: string;
  actorRole: AppRole;
  previousStatus: FindingLifecycleStatus;
  newStatus: FindingLifecycleStatus;
  notes?: string;
  rejectionReason?: string;
}

export interface SafetyFindingRecord {
  id: string;
  referenceNo: string; // FND-YYYY-XXXX
  title: string;
  description: string;
  source: FindingSource; // 'DIRECT' | 'PATROL'
  patrolId?: string | null;
  patrolRefNo?: string | null;
  checklistItemId?: string | null;

  // Master Data Organization (Module 03)
  departmentId: string;
  departmentName: string;
  sectionId: string;
  sectionName: string;
  operationalAreaId: string;
  operationalAreaName: string;
  locationDetails?: string;

  // Master Data Safety Classification (Module 03)
  categoryId: string; // Finding Category (Unsafe Act / Unsafe Condition / Kaizen)
  categoryName: string;
  hazardCategoryId?: string;
  hazardCategoryName?: string;
  riskLevelId: string;
  riskLevelName: string;
  riskDisplayColor?: string;
  incidentTypeId?: string;
  incidentTypeName?: string;

  // Photo / Evidence
  evidence?: FindingEvidence | null;

  // Reporter Session Identity
  reportedByNoreg: string;
  reportedByName: string;
  reportedByDepartment: string;
  reportedAt: string; // ISO 8601

  // Status & Audit
  status: FindingLifecycleStatus;
  rejectionReason?: string;
  reviewHistory: FindingReviewEntry[];
  correctiveActionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatrolChecklistItem {
  id: string;
  label: string;
  category: string; // e.g. "5S & Housekeeping", "Material Handling", "Fire & Emergency"
  isMandatory: boolean;
  status: ChecklistItemStatus;
  notes?: string;
  relatedFindingId?: string | null;
  relatedFindingRefNo?: string | null;
}

export interface SafetyPatrolRecord {
  id: string;
  referenceNo: string; // PTR-YYYY-XXXX
  patrolName: string;
  description?: string;
  plannedDate: string; // YYYY-MM-DD
  conductedDate?: string | null;

  // Master Data Location (Module 03)
  departmentId: string;
  departmentName: string;
  sectionId?: string;
  sectionName?: string;
  operationalAreaId: string;
  operationalAreaName: string;

  // Team & Leadership
  leaderNoreg: string;
  leaderName: string;
  assignedTeam: { noreg: string; name: string; role?: string }[];

  // Execution & Checklist
  status: PatrolLifecycleStatus;
  checklist: PatrolChecklistItem[];
  generalObservations?: string;
  findingsCount: number;
  relatedFindingIds: string[];

  createdByNoreg: string;
  createdAt: string;
  updatedAt: string;
}

export interface FindingFilters {
  search?: string;
  source?: 'ALL' | FindingSource;
  status?: 'ALL' | FindingLifecycleStatus;
  departmentId?: string;
  operationalAreaId?: string;
  categoryId?: string;
  riskLevelId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PatrolFilters {
  search?: string;
  status?: 'ALL' | PatrolLifecycleStatus;
  departmentId?: string;
  operationalAreaId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateDirectFindingInput {
  title: string;
  description: string;
  departmentId: string;
  sectionId: string;
  operationalAreaId: string;
  locationDetails?: string;
  categoryId: string;
  hazardCategoryId?: string;
  riskLevelId: string;
  incidentTypeId?: string;
  evidence?: FindingEvidence | null;
}

export interface CreatePatrolFindingInput extends CreateDirectFindingInput {
  patrolId: string;
  checklistItemId?: string;
}

export interface CreatePatrolInput {
  patrolName: string;
  description?: string;
  plannedDate: string;
  departmentId: string;
  sectionId?: string;
  operationalAreaId: string;
  leaderNoreg: string;
  leaderName: string;
  assignedTeam?: { noreg: string; name: string; role?: string }[];
  checklistItems?: { label: string; category: string; isMandatory: boolean }[];
}

