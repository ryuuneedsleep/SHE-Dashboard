/**
 * SPLD SAFETY - Safety Management System
 * Module 01 & Module 02: User Registration, Authentication & Role Governance
 * Core Data Models & Type Definitions
 */

export type AccountStatus = 'Pending' | 'Active' | 'Rejected' | 'Suspended' | 'Inactive';

/**
 * FINAL ROLE STRUCTURE (Module 02 Policy Update):
 * - QSHE_ADMIN: Super Admin-level privileges (Single administrative role)
 * - APPROVER: Approver / Section Leader
 * - MEMBER: Standard Member / Reporter
 * - MANAGEMENT: Management Oversight
 *
 * NOTE: There is NO separate SUPER_ADMIN role.
 */
export type AppRole = 'QSHE_ADMIN' | 'APPROVER' | 'MEMBER' | 'MANAGEMENT';

export type StandardDepartment =
  | 'Warehouse'
  | 'IM'
  | 'SPPM'
  | 'SM'
  | 'QSHE & Jiritsuka'
  | 'Lain-lain';

export type StandardPosition =
  | 'Operator'
  | 'Staff'
  | 'Group Head'
  | 'Line Head'
  | 'Section Head'
  | 'Department Head / Manager'
  | 'Other';

/**
 * Registration Request Model
 * Decoupled from user credentials. Never stores plaintext passwords.
 */
export interface RegistrationRequest {
  registrationId: string;
  fullName: string;
  noreg: string;
  phone: string;
  email: string;
  department: StandardDepartment | string;
  otherDepartmentName?: string;
  section: string;
  position: StandardPosition | string;
  otherPositionName?: string;
  requestedRole: string; // Defaults to "Member / Reporter"
  accountStatus: AccountStatus;
  registrationDate: string; // ISO String
  approvalDate?: string | null;
  approvedBy?: string | null;
  rejectionReason?: string | null;
  assignedRole?: AppRole | null;
  assignedAreaAccess?: string[] | null;
}

/**
 * Authenticated User Representation
 * Supports multiple Area Access assignments (areaAccess: string[])
 */
export interface AuthUser {
  id: string;
  noreg: string;
  fullName: string;
  email: string;
  department: string;
  section: string;
  position: string;
  role: AppRole;
  areaAccess: string[]; // Multiple operational areas
  status: AccountStatus;
}

/**
 * Registration Form Input Payload
 */
export interface RegistrationFormData {
  fullName: string;
  noreg: string;
  phone: string;
  email: string;
  department: StandardDepartment | string;
  otherDepartmentName?: string;
  section: string;
  position: StandardPosition | string;
  otherPositionName?: string;
  password: string;
  confirmPassword: string;
  agreement: boolean;
}

/**
 * Login Input Payload
 */
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Forgot Password Input Payload
 */
export interface ForgotPasswordFormData {
  email: string;
  noreg?: string;
}

/**
 * Login Result Type
 */
export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  status?: AccountStatus;
  errorMessage?: string;
  errorCode?:
    | 'INVALID_CREDENTIALS'
    | 'PENDING_APPROVAL'
    | 'ACCOUNT_REJECTED'
    | 'ACCOUNT_SUSPENDED'
    | 'ACCOUNT_INACTIVE'
    | 'SYSTEM_ERROR';
  registrationDetails?: RegistrationRequest;
}

/**
 * Master Data Structure for configurable dropdowns & areas
 */
export interface MasterItem {
  id: string;
  name: string;
  code?: string;
  departmentRef?: StandardDepartment;
  isCustom?: boolean;
}

/**
 * Audit Log Action Types (Module 02 Policy Update)
 */
export type AuditActionType =
  | 'REGISTRATION_APPROVED'
  | 'REGISTRATION_REJECTED'
  | 'ROLE_CHANGED'
  | 'AREA_ACCESS_CHANGED'
  | 'ACCOUNT_STATUS_CHANGED'
  | 'ADMIN_PRIVILEGE_CHANGED'
  | 'MASTER_DATA_CREATED'
  | 'MASTER_DATA_UPDATED'
  | 'MASTER_DATA_STATUS_CHANGED'
  | 'DIRECT_FINDING_CREATED'
  | 'PATROL_FINDING_CREATED'
  | 'FINDING_STATUS_CHANGED'
  | 'FINDING_REJECTED'
  | 'PATROL_SCHEDULED'
  | 'PATROL_COMPLETED'
  | 'PATROL_CANCELLED';

/**
 * Audit Log Entry Model
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO String
  actorId: string;
  actorName: string;
  actorNoreg: string;
  actorRole: AppRole;
  targetUserId: string;
  targetUserName: string;
  targetUserNoreg: string;
  action: AuditActionType;
  details: string;
  previousValue?: string | string[] | null;
  newValue?: string | string[] | null;
}
