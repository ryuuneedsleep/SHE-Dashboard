/**
 * SPLD SAFETY - Safety Management System
 * Module 03: Master Data Management
 * Data Models & Type Definitions
 */

export type MasterDataStatus = 'Active' | 'Inactive';

/**
 * Common Base Interface for all Master Data records
 */
export interface BaseMasterRecord {
  id: string;
  code: string; // Unique within category
  name: string;
  description?: string;
  status: MasterDataStatus;
  createdAt: string; // ISO String
  createdBy: string; // Administrator name & Noreg
  updatedAt: string;
  updatedBy: string;
  isSystemSeeded?: boolean;
}

// ---------------------------------------------------------------------------
// Organizational Master Data Entities
// ---------------------------------------------------------------------------

/**
 * 1. Department Master Data
 */
export type DepartmentRecord = BaseMasterRecord;

/**
 * 2. Section / Area Master Data
 * Linked to a parent Department
 */
export interface SectionRecord extends BaseMasterRecord {
  departmentId: string;
  departmentName: string;
}

/**
 * 3. Position / Jabatan Master Data
 */
export interface PositionRecord extends BaseMasterRecord {
  departmentRef?: string; // Optional department-specific restriction
}

/**
 * 4. Operational Area Master Data
 * Distinct from organizational sections. Sourced for user areaAccess: string[]
 */
export interface OperationalAreaRecord extends BaseMasterRecord {
  location: string; // Physical warehouse zone / bay / dock
}

// ---------------------------------------------------------------------------
// Safety Master Data Entities
// ---------------------------------------------------------------------------

/**
 * 5. Safety Category Master Data
 */
export type SafetyCategoryRecord = BaseMasterRecord;

/**
 * 6. Hazard Category Master Data
 */
export type HazardCategoryRecord = BaseMasterRecord;

/**
 * 7. Finding Category Master Data
 */
export type FindingCategoryRecord = BaseMasterRecord;

/**
 * 8. Risk Level Master Data
 * Supports configurable display color and custom sort order
 */
export interface RiskLevelRecord extends BaseMasterRecord {
  displayColor: string; // Hex code or standard corporate color token
  sortOrder: number; // Controls rank display order (1 = Lowest, 4 = Highest)
}

/**
 * 9. Incident Type Master Data
 */
export type IncidentTypeRecord = BaseMasterRecord;

/**
 * 10. Corrective Action Category Master Data
 */
export type CorrectiveActionCategoryRecord = BaseMasterRecord;

/**
 * Shared Form Data Payload for Master Data Modal
 */
export interface MasterDataFormData {
  code: string;
  name: string;
  description?: string;
  departmentId?: string;
  location?: string;
  displayColor?: string;
  sortOrder?: number;
}

// ---------------------------------------------------------------------------
// Union and Helper Types
// ---------------------------------------------------------------------------

export type MasterDataCategory =
  | 'departments'
  | 'sections'
  | 'positions'
  | 'operational_areas'
  | 'safety_categories'
  | 'hazard_categories'
  | 'finding_categories'
  | 'risk_levels'
  | 'incident_types'
  | 'corrective_action_categories';

export type MasterRecord =
  | DepartmentRecord
  | SectionRecord
  | PositionRecord
  | OperationalAreaRecord
  | SafetyCategoryRecord
  | HazardCategoryRecord
  | FindingCategoryRecord
  | RiskLevelRecord
  | IncidentTypeRecord
  | CorrectiveActionCategoryRecord;

export interface InUseCheckResult {
  isInUse: boolean;
  canDeactivate: boolean;
  reason?: string;
  referenceCount: number;
}

