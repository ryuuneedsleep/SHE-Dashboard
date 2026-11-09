/**
 * SPLD SAFETY - Safety Management System
 * Module 01 & Module 02: Authentication, User Registration & Role Governance
 *
 * ARCHITECTURAL DESIGN NOTE:
 * - Clean Architecture / Service Abstraction.
 * - Single Administrative Role: QSHE_ADMIN with Super Admin-level privileges.
 * - Strictly enforces: Only QSHE Admin can approve registrations, change roles, or update area access.
 * - Prevents self-approval and self-role-modification.
 * - Enforces Administrator Safety: Last active QSHE Admin cannot be demoted, deactivated, or suspended.
 * - Supports Multiple Area Access (areaAccess: string[]).
 * - Empty Area Access assignment does NOT grant unrestricted access.
 * - Centralized Audit Log recording every administrative action.
 */

import type {
  AccountStatus,
  AppRole,
  AuthUser,
  AuditLogEntry,
  AuditActionType,
  LoginResult,
  RegistrationFormData,
  RegistrationRequest,
} from '../types/auth';

/**
 * In-memory repository for Registration Requests
 */
class RegistrationRepository {
  private requests: RegistrationRequest[] = [
    {
      registrationId: 'REG-2026-0001',
      fullName: 'Agus Pratama',
      noreg: 'TAM-8802',
      phone: '081234567891',
      email: 'agus.pratama@toyota.co.id',
      department: 'Warehouse',
      section: 'Receiving & Inbound Area',
      position: 'Operator',
      requestedRole: 'Member / Reporter',
      accountStatus: 'Pending',
      registrationDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
    {
      registrationId: 'REG-2026-0002',
      fullName: 'Rian Hidayat',
      noreg: 'TAM-8803',
      phone: '081234567892',
      email: 'rian.hidayat@toyota.co.id',
      department: 'IM',
      section: 'Storage & Stacking Zone',
      position: 'Operator',
      requestedRole: 'Member / Reporter',
      accountStatus: 'Rejected',
      registrationDate: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      approvalDate: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      approvedBy: 'Budi Santoso (TAM-8801)',
      rejectionReason: 'Employee number verification mismatch with HR central directory.',
    },
    {
      registrationId: 'REG-2026-0003',
      fullName: 'Doni Kurniawan',
      noreg: 'TAM-8810',
      phone: '081234567895',
      email: 'doni.kurniawan@toyota.co.id',
      department: 'SPPM',
      section: 'Shipping & Outbound Area',
      position: 'Staff',
      requestedRole: 'Member / Reporter',
      accountStatus: 'Pending',
      registrationDate: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    },
  ];

  public getAll(): RegistrationRequest[] {
    return [...this.requests];
  }

  public getPending(): RegistrationRequest[] {
    return this.requests.filter((r) => r.accountStatus === 'Pending');
  }

  public findById(id: string): RegistrationRequest | undefined {
    return this.requests.find(
      (r) => r.registrationId.trim().toLowerCase() === id.trim().toLowerCase()
    );
  }

  public findByNoreg(noreg: string): RegistrationRequest | undefined {
    return this.requests.find(
      (r) => r.noreg.trim().toLowerCase() === noreg.trim().toLowerCase()
    );
  }

  public findByEmail(email: string): RegistrationRequest | undefined {
    return this.requests.find(
      (r) => r.email.trim().toLowerCase() === email.trim().toLowerCase()
    );
  }

  public create(request: RegistrationRequest): RegistrationRequest {
    this.requests.unshift(request);
    return request;
  }

  public update(request: RegistrationRequest): void {
    const idx = this.requests.findIndex(
      (r) => r.registrationId === request.registrationId
    );
    if (idx !== -1) {
      this.requests[idx] = { ...request };
    }
  }
}

/**
 * Audit Log Repository
 */
class AuditLogRepository {
  private logs: AuditLogEntry[] = [
    {
      id: 'LOG-0001',
      timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      actorId: 'USR-8801',
      actorName: 'Budi Santoso',
      actorNoreg: 'TAM-8801',
      actorRole: 'QSHE_ADMIN',
      targetUserId: 'USR-8807',
      targetUserName: 'Hendra Gunawan',
      targetUserNoreg: 'TAM-8807',
      action: 'ROLE_CHANGED',
      details: 'Assigned initial Section Leader operational role.',
      previousValue: 'MEMBER',
      newValue: 'APPROVER',
    },
    {
      id: 'LOG-0002',
      timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      actorId: 'USR-8801',
      actorName: 'Budi Santoso',
      actorNoreg: 'TAM-8801',
      actorRole: 'QSHE_ADMIN',
      targetUserId: 'REG-2026-0002',
      targetUserName: 'Rian Hidayat',
      targetUserNoreg: 'TAM-8803',
      action: 'REGISTRATION_REJECTED',
      details:
        'Registration rejected: Employee number verification mismatch with HR central directory.',
      previousValue: 'Pending',
      newValue: 'Rejected',
    },
  ];

  public getAll(): AuditLogEntry[] {
    return [...this.logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public record(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
    };
    this.logs.unshift(newEntry);
    return newEntry;
  }
}

/**
 * Internal Mock Security Record
 */
interface MockCredentialRecord {
  id: string;
  noreg: string;
  email: string;
  fullName: string;
  department: string;
  section: string;
  position: string;
  role: AppRole;
  areaAccess: string[];
  status: AccountStatus;
  passwordHash: string;
}

function mockHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_v1_${Math.abs(hash).toString(16)}`;
}

class MockIdentityStore {
  private users: MockCredentialRecord[] = [
    {
      id: 'USR-8801',
      noreg: 'TAM-8801',
      email: 'budi.santoso@toyota.co.id',
      fullName: 'Budi Santoso',
      department: 'QSHE & Jiritsuka',
      section: 'Safety & Environmental Control (QSHE)',
      position: 'Staff',
      role: 'QSHE_ADMIN', // Super Admin
      areaAccess: [
        'sec-rec',
        'sec-sto',
        'sec-pic',
        'sec-pac',
        'sec-shi',
        'sec-inv',
        'sec-qshe',
        'sec-jrk',
        'sec-adm',
        'sec-oth',
      ],
      status: 'Active',
      passwordHash: mockHash('Toyota@2026'),
    },
    {
      id: 'USR-8806',
      noreg: 'TAM-8806',
      email: 'siti.rahma@toyota.co.id',
      fullName: 'Siti Rahma',
      department: 'QSHE & Jiritsuka',
      section: 'Safety & Environmental Control (QSHE)',
      position: 'Section Head',
      role: 'QSHE_ADMIN', // Co-Admin for testing administrator safety rules
      areaAccess: ['sec-qshe', 'sec-jrk', 'sec-adm'],
      status: 'Active',
      passwordHash: mockHash('Toyota@2026'),
    },
    {
      id: 'USR-8807',
      noreg: 'TAM-8807',
      email: 'hendra.gunawan@toyota.co.id',
      fullName: 'Hendra Gunawan',
      department: 'Warehouse',
      section: 'Receiving & Inbound Area',
      position: 'Line Head',
      role: 'APPROVER',
      areaAccess: ['sec-rec', 'sec-sto'],
      status: 'Active',
      passwordHash: mockHash('Toyota@2026'),
    },
    {
      id: 'USR-8808',
      noreg: 'TAM-8808',
      email: 'siti.aminah@toyota.co.id',
      fullName: 'Siti Aminah',
      department: 'Warehouse',
      section: 'Picking & Sorting Line',
      position: 'Operator',
      role: 'MEMBER',
      areaAccess: ['sec-pic'],
      status: 'Active',
      passwordHash: mockHash('Toyota@2026'),
    },
    {
      id: 'USR-8809',
      noreg: 'TAM-8809',
      email: 'bambang.soediro@toyota.co.id',
      fullName: 'Bambang Soediro',
      department: 'SM',
      section: 'Office & Logistics Administration',
      position: 'Department Head / Manager',
      role: 'MANAGEMENT',
      areaAccess: ['sec-rec', 'sec-shi', 'sec-qshe'],
      status: 'Active',
      passwordHash: mockHash('Toyota@2026'),
    },
    {
      id: 'USR-8802',
      noreg: 'TAM-8802',
      email: 'agus.pratama@toyota.co.id',
      fullName: 'Agus Pratama',
      department: 'Warehouse',
      section: 'Receiving & Inbound Area',
      position: 'Operator',
      role: 'MEMBER',
      areaAccess: [],
      status: 'Pending',
      passwordHash: mockHash('Toyota@2026'),
    },
    {
      id: 'USR-8803',
      noreg: 'TAM-8803',
      email: 'rian.hidayat@toyota.co.id',
      fullName: 'Rian Hidayat',
      department: 'IM',
      section: 'Storage & Stacking Zone',
      position: 'Operator',
      role: 'MEMBER',
      areaAccess: ['sec-sto'],
      status: 'Rejected',
      passwordHash: mockHash('Toyota@2026'),
    },
    {
      id: 'USR-8804',
      noreg: 'TAM-8804',
      email: 'dewi.lestari@toyota.co.id',
      fullName: 'Dewi Lestari',
      department: 'SPPM',
      section: 'Shipping & Outbound Area',
      position: 'Staff',
      role: 'APPROVER',
      areaAccess: ['sec-shi'],
      status: 'Suspended',
      passwordHash: mockHash('Toyota@2026'),
    },
    {
      id: 'USR-8805',
      noreg: 'TAM-8805',
      email: 'fajar.nugraha@toyota.co.id',
      fullName: 'Fajar Nugraha',
      department: 'SM',
      section: 'Inventory Audit & Cycle Count',
      position: 'Group Head',
      role: 'MANAGEMENT',
      areaAccess: ['sec-inv'],
      status: 'Inactive',
      passwordHash: mockHash('Toyota@2026'),
    },
  ];

  public getAll(): MockCredentialRecord[] {
    return [...this.users];
  }

  public findById(id: string): MockCredentialRecord | undefined {
    return this.users.find((u) => u.id === id);
  }

  public findByEmail(email: string): MockCredentialRecord | undefined {
    return this.users.find(
      (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()
    );
  }

  public findByNoreg(noreg: string): MockCredentialRecord | undefined {
    return this.users.find(
      (u) => u.noreg.trim().toLowerCase() === noreg.trim().toLowerCase()
    );
  }

  public countActiveAdmins(): number {
    return this.users.filter(
      (u) => u.status === 'Active' && u.role === 'QSHE_ADMIN'
    ).length;
  }

  public registerUser(
    data: RegistrationFormData,
    status: AccountStatus
  ): MockCredentialRecord {
    const newRecord: MockCredentialRecord = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      noreg: data.noreg.trim(),
      email: data.email.trim().toLowerCase(),
      fullName: data.fullName.trim(),
      department:
        data.department === 'Lain-lain'
          ? data.otherDepartmentName || 'Lain-lain'
          : data.department,
      section: data.section.trim(),
      position:
        data.position === 'Other'
          ? data.otherPositionName || 'Other'
          : data.position,
      role: 'MEMBER', // Default role; final role assigned by QSHE Admin
      areaAccess: [], // Must be explicitly assigned by QSHE Admin upon approval
      status,
      passwordHash: mockHash(data.password),
    };
    this.users.push(newRecord);
    return newRecord;
  }

  public updateUser(record: MockCredentialRecord): void {
    const idx = this.users.findIndex((u) => u.id === record.id);
    if (idx !== -1) {
      this.users[idx] = { ...record };
    }
  }
}

/**
 * Service Interface
 */
export interface IAuthService {
  checkNoregAvailability(noreg: string): Promise<boolean>;
  checkEmailAvailability(email: string): Promise<boolean>;
  register(formData: RegistrationFormData): Promise<RegistrationRequest>;
  login(email: string, password: string): Promise<LoginResult>;
  forgotPassword(email: string): Promise<{ success: boolean; message: string }>;
  getCurrentUser(): AuthUser | null;
  findRegistration(query: string): RegistrationRequest | undefined;
  logout(): void;

  // Module 02: Administrative Methods
  getAllUsers(): AuthUser[];
  getPendingRegistrations(): RegistrationRequest[];
  approveRegistration(
    adminUser: AuthUser,
    registrationId: string,
    assignedRole: AppRole,
    assignedAreas: string[]
  ): Promise<RegistrationRequest>;
  rejectRegistration(
    adminUser: AuthUser,
    registrationId: string,
    reason: string
  ): Promise<RegistrationRequest>;
  updateUserRole(
    adminUser: AuthUser,
    targetUserId: string,
    newRole: AppRole
  ): Promise<AuthUser>;
  updateUserAreaAccess(
    adminUser: AuthUser,
    targetUserId: string,
    newAreaAccess: string[]
  ): Promise<AuthUser>;
  updateUserStatus(
    adminUser: AuthUser,
    targetUserId: string,
    newStatus: AccountStatus
  ): Promise<AuthUser>;
  hasAreaAccess(user: AuthUser, areaId: string): boolean;
  getAuditLogs(): AuditLogEntry[];
  logAuditAction(
    actor: AuthUser,
    action: AuditActionType,
    targetId: string,
    refNo: string,
    details: string
  ): AuditLogEntry;
}

/**
 * Service Implementation: MockAuthService
 */
export class MockAuthService implements IAuthService {
  private registrationRepo = new RegistrationRepository();
  private identityStore = new MockIdentityStore();
  private auditRepo = new AuditLogRepository();
  private currentUser: AuthUser | null = null;
  private currentPendingRegistration: RegistrationRequest | null = null;

  constructor() {
    if (typeof sessionStorage !== 'undefined') {
      const savedUser = sessionStorage.getItem('spld_current_user');
      if (savedUser) {
        try {
          this.currentUser = JSON.parse(savedUser);
        } catch {
          this.currentUser = null;
        }
      }
    }
  }

  public async checkNoregAvailability(noreg: string): Promise<boolean> {
    const trimmed = noreg.trim();
    if (!trimmed) return true;
    const inIdentity = this.identityStore.findByNoreg(trimmed);
    const inRepo = this.registrationRepo.findByNoreg(trimmed);
    return !inIdentity && !inRepo;
  }

  public async checkEmailAvailability(email: string): Promise<boolean> {
    const trimmed = email.trim();
    if (!trimmed) return true;
    const inIdentity = this.identityStore.findByEmail(trimmed);
    const inRepo = this.registrationRepo.findByEmail(trimmed);
    return !inIdentity && !inRepo;
  }

  public async register(formData: RegistrationFormData): Promise<RegistrationRequest> {
    const isNoregAvailable = await this.checkNoregAvailability(formData.noreg);
    if (!isNoregAvailable) {
      throw new Error(`Employee Number (Noreg) "${formData.noreg}" is already registered.`);
    }

    const isEmailAvailable = await this.checkEmailAvailability(formData.email);
    if (!isEmailAvailable) {
      throw new Error(`Email address "${formData.email}" is already registered.`);
    }

    const newRegistration: RegistrationRequest = {
      registrationId: `REG-${new Date().getFullYear()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`,
      fullName: formData.fullName.trim(),
      noreg: formData.noreg.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      department: formData.department,
      otherDepartmentName:
        formData.department === 'Lain-lain'
          ? formData.otherDepartmentName?.trim()
          : undefined,
      section: formData.section.trim(),
      position: formData.position,
      otherPositionName:
        formData.position === 'Other'
          ? formData.otherPositionName?.trim()
          : undefined,
      requestedRole: 'Member / Reporter',
      accountStatus: 'Pending',
      registrationDate: new Date().toISOString(),
      approvalDate: null,
      approvedBy: null,
    };

    this.registrationRepo.create(newRegistration);
    this.identityStore.registerUser(formData, 'Pending');
    this.currentPendingRegistration = newRegistration;

    return newRegistration;
  }

  public async login(email: string, password: string): Promise<LoginResult> {
    const trimmedEmail = email.trim().toLowerCase();
    const userRecord = this.identityStore.findByEmail(trimmedEmail);

    if (!userRecord) {
      return {
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        errorMessage: 'Invalid email address or password.',
      };
    }

    const inputHash = mockHash(password);
    if (userRecord.passwordHash !== inputHash) {
      return {
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        errorMessage: 'Invalid email address or password.',
      };
    }

    switch (userRecord.status) {
      case 'Active': {
        const authUser: AuthUser = {
          id: userRecord.id,
          noreg: userRecord.noreg,
          fullName: userRecord.fullName,
          email: userRecord.email,
          department: userRecord.department,
          section: userRecord.section,
          position: userRecord.position,
          role: userRecord.role,
          areaAccess: userRecord.areaAccess || [],
          status: 'Active',
        };
        this.currentUser = authUser;
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('spld_current_user', JSON.stringify(authUser));
        }
        return {
          success: true,
          status: 'Active',
          user: authUser,
        };
      }

      case 'Pending': {
        const regRequest = this.registrationRepo.findByEmail(userRecord.email);
        return {
          success: false,
          status: 'Pending',
          errorCode: 'PENDING_APPROVAL',
          errorMessage:
            'Your account registration has been submitted and is currently pending QSHE Admin approval.',
          registrationDetails: regRequest,
        };
      }

      case 'Rejected': {
        const regRequest = this.registrationRepo.findByEmail(userRecord.email);
        return {
          success: false,
          status: 'Rejected',
          errorCode: 'ACCOUNT_REJECTED',
          errorMessage:
            'Your registration request was not approved by the QSHE Administrator. Please contact your Department Safety Leader or HR for assistance.',
          registrationDetails: regRequest,
        };
      }

      case 'Suspended': {
        return {
          success: false,
          status: 'Suspended',
          errorCode: 'ACCOUNT_SUSPENDED',
          errorMessage:
            'This account has been temporarily suspended due to security or compliance policy. Please contact the QSHE Committee.',
        };
      }

      case 'Inactive': {
        return {
          success: false,
          status: 'Inactive',
          errorCode: 'ACCOUNT_INACTIVE',
          errorMessage:
            'Access denied. This account has been deactivated. Please contact your administrator.',
        };
      }

      default:
        return {
          success: false,
          errorCode: 'SYSTEM_ERROR',
          errorMessage: 'An unexpected system error occurred.',
        };
    }
  }

  public async forgotPassword(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    const trimmedEmail = email.trim().toLowerCase();
    const user = this.identityStore.findByEmail(trimmedEmail);

    if (!user) {
      return {
        success: true,
        message:
          'If an account associated with this email exists in SPLD SAFETY, password reset instructions will be handled through corporate Identity Provider (SSPR / Entra ID).',
      };
    }

    return {
      success: true,
      message:
        'Password recovery request initiated. In production, this directs to Microsoft Entra ID Self-Service Password Reset (SSPR) or your registered corporate authenticator.',
    };
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  public getLatestPendingRegistration(): RegistrationRequest | null {
    return this.currentPendingRegistration;
  }

  public findRegistration(query: string): RegistrationRequest | undefined {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return undefined;
    return this.registrationRepo.getAll().find(
      (r) =>
        r.noreg.trim().toLowerCase() === trimmed ||
        r.email.trim().toLowerCase() === trimmed ||
        r.registrationId.trim().toLowerCase() === trimmed
    );
  }

  public logout(): void {
    this.currentUser = null;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('spld_current_user');
    }
  }

  // =========================================================================
  // MODULE 02: ADMINISTRATIVE FUNCTIONS (STRICTLY QSHE_ADMIN ONLY)
  // =========================================================================

  private verifyAdminAuthority(actor: AuthUser): void {
    if (actor.role !== 'QSHE_ADMIN') {
      throw new Error(
        'Access Denied: Only QSHE Admin possesses authorization to perform this action.'
      );
    }
    if (actor.status !== 'Active') {
      throw new Error('Access Denied: Inactive administrator account.');
    }
  }

  public getAllUsers(): AuthUser[] {
    return this.identityStore.getAll().map((u) => ({
      id: u.id,
      noreg: u.noreg,
      fullName: u.fullName,
      email: u.email,
      department: u.department,
      section: u.section,
      position: u.position,
      role: u.role,
      areaAccess: u.areaAccess || [],
      status: u.status,
    }));
  }

  public getPendingRegistrations(): RegistrationRequest[] {
    return this.registrationRepo.getPending();
  }

  public async approveRegistration(
    adminUser: AuthUser,
    registrationId: string,
    assignedRole: AppRole,
    assignedAreas: string[]
  ): Promise<RegistrationRequest> {
    this.verifyAdminAuthority(adminUser);

    const reg = this.registrationRepo.findById(registrationId);
    if (!reg) {
      throw new Error(`Registration request "${registrationId}" not found.`);
    }

    if (reg.accountStatus !== 'Pending') {
      throw new Error(`Registration request is already marked as ${reg.accountStatus}.`);
    }

    // Prevent self-approval
    if (
      adminUser.noreg.toLowerCase() === reg.noreg.toLowerCase() ||
      adminUser.email.toLowerCase() === reg.email.toLowerCase()
    ) {
      throw new Error('Access Denied: Self-approval is strictly prohibited.');
    }

    const previousStatus = reg.accountStatus;
    const approvalTimestamp = new Date().toISOString();
    const approvedBy = `${adminUser.fullName} (${adminUser.noreg})`;

    // Update registration request
    reg.accountStatus = 'Active';
    reg.approvalDate = approvalTimestamp;
    reg.approvedBy = approvedBy;
    reg.assignedRole = assignedRole;
    reg.assignedAreaAccess = [...assignedAreas];
    this.registrationRepo.update(reg);

    // Update or provision in Identity Store
    const identityUser = this.identityStore.findByEmail(reg.email);
    if (identityUser) {
      identityUser.status = 'Active';
      identityUser.role = assignedRole;
      identityUser.areaAccess = [...assignedAreas];
      this.identityStore.updateUser(identityUser);
    }

    // Record Audit Log
    this.auditRepo.record({
      actorId: adminUser.id,
      actorName: adminUser.fullName,
      actorNoreg: adminUser.noreg,
      actorRole: adminUser.role,
      targetUserId: identityUser?.id || reg.registrationId,
      targetUserName: reg.fullName,
      targetUserNoreg: reg.noreg,
      action: 'REGISTRATION_APPROVED',
      details: `Approved registration. Assigned role: ${assignedRole}. Operational areas assigned: [${assignedAreas.join(
        ', '
      )}].`,
      previousValue: previousStatus,
      newValue: 'Active',
    });

    return reg;
  }

  public async rejectRegistration(
    adminUser: AuthUser,
    registrationId: string,
    reason: string
  ): Promise<RegistrationRequest> {
    this.verifyAdminAuthority(adminUser);

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      throw new Error('Rejection reason is mandatory.');
    }

    const reg = this.registrationRepo.findById(registrationId);
    if (!reg) {
      throw new Error(`Registration request "${registrationId}" not found.`);
    }

    if (reg.accountStatus !== 'Pending') {
      throw new Error(`Registration request is already marked as ${reg.accountStatus}.`);
    }

    // Prevent self-rejection
    if (
      adminUser.noreg.toLowerCase() === reg.noreg.toLowerCase() ||
      adminUser.email.toLowerCase() === reg.email.toLowerCase()
    ) {
      throw new Error('Access Denied: Self-decision is strictly prohibited.');
    }

    const previousStatus = reg.accountStatus;
    const decisionTimestamp = new Date().toISOString();
    const approvedBy = `${adminUser.fullName} (${adminUser.noreg})`;

    reg.accountStatus = 'Rejected';
    reg.approvalDate = decisionTimestamp;
    reg.approvedBy = approvedBy;
    reg.rejectionReason = trimmedReason;
    this.registrationRepo.update(reg);

    const identityUser = this.identityStore.findByEmail(reg.email);
    if (identityUser) {
      identityUser.status = 'Rejected';
      this.identityStore.updateUser(identityUser);
    }

    this.auditRepo.record({
      actorId: adminUser.id,
      actorName: adminUser.fullName,
      actorNoreg: adminUser.noreg,
      actorRole: adminUser.role,
      targetUserId: identityUser?.id || reg.registrationId,
      targetUserName: reg.fullName,
      targetUserNoreg: reg.noreg,
      action: 'REGISTRATION_REJECTED',
      details: `Rejected registration with reason: "${trimmedReason}".`,
      previousValue: previousStatus,
      newValue: 'Rejected',
    });

    return reg;
  }

  public async updateUserRole(
    adminUser: AuthUser,
    targetUserId: string,
    newRole: AppRole
  ): Promise<AuthUser> {
    this.verifyAdminAuthority(adminUser);

    const target = this.identityStore.findById(targetUserId);
    if (!target) {
      throw new Error(`Target user ID "${targetUserId}" not found.`);
    }

    // Prevent modifying own role
    if (adminUser.id === targetUserId) {
      throw new Error('Access Denied: Users are not permitted to change their own role.');
    }

    // Administrator Safety Rule: Prevent removing last active QSHE Admin
    if (
      target.role === 'QSHE_ADMIN' &&
      newRole !== 'QSHE_ADMIN' &&
      target.status === 'Active'
    ) {
      const activeAdminsCount = this.identityStore.countActiveAdmins();
      if (activeAdminsCount <= 1) {
        throw new Error(
          'Administrator Safety Violation: Cannot revoke administrative privileges from the last active QSHE Admin account.'
        );
      }
    }

    const previousRole = target.role;
    target.role = newRole;
    this.identityStore.updateUser(target);

    // Audit Log
    const isPrivilegeChange =
      previousRole === 'QSHE_ADMIN' || newRole === 'QSHE_ADMIN';
    this.auditRepo.record({
      actorId: adminUser.id,
      actorName: adminUser.fullName,
      actorNoreg: adminUser.noreg,
      actorRole: adminUser.role,
      targetUserId: target.id,
      targetUserName: target.fullName,
      targetUserNoreg: target.noreg,
      action: isPrivilegeChange ? 'ADMIN_PRIVILEGE_CHANGED' : 'ROLE_CHANGED',
      details: `Changed role from ${previousRole} to ${newRole}.`,
      previousValue: previousRole,
      newValue: newRole,
    });

    return {
      id: target.id,
      noreg: target.noreg,
      fullName: target.fullName,
      email: target.email,
      department: target.department,
      section: target.section,
      position: target.position,
      role: target.role,
      areaAccess: target.areaAccess,
      status: target.status,
    };
  }

  public async updateUserAreaAccess(
    adminUser: AuthUser,
    targetUserId: string,
    newAreaAccess: string[]
  ): Promise<AuthUser> {
    this.verifyAdminAuthority(adminUser);

    const target = this.identityStore.findById(targetUserId);
    if (!target) {
      throw new Error(`Target user ID "${targetUserId}" not found.`);
    }

    const previousAreas = [...(target.areaAccess || [])];
    target.areaAccess = [...newAreaAccess];
    this.identityStore.updateUser(target);

    // Audit Log
    this.auditRepo.record({
      actorId: adminUser.id,
      actorName: adminUser.fullName,
      actorNoreg: adminUser.noreg,
      actorRole: adminUser.role,
      targetUserId: target.id,
      targetUserName: target.fullName,
      targetUserNoreg: target.noreg,
      action: 'AREA_ACCESS_CHANGED',
      details: `Updated operational areas. Assigned areas count: ${newAreaAccess.length}.`,
      previousValue: previousAreas,
      newValue: newAreaAccess,
    });

    return {
      id: target.id,
      noreg: target.noreg,
      fullName: target.fullName,
      email: target.email,
      department: target.department,
      section: target.section,
      position: target.position,
      role: target.role,
      areaAccess: target.areaAccess,
      status: target.status,
    };
  }

  public async updateUserStatus(
    adminUser: AuthUser,
    targetUserId: string,
    newStatus: AccountStatus
  ): Promise<AuthUser> {
    this.verifyAdminAuthority(adminUser);

    const target = this.identityStore.findById(targetUserId);
    if (!target) {
      throw new Error(`Target user ID "${targetUserId}" not found.`);
    }

    // Administrator Safety Rule: Prevent deactivation of the last active QSHE Admin
    if (
      target.role === 'QSHE_ADMIN' &&
      target.status === 'Active' &&
      newStatus !== 'Active'
    ) {
      const activeAdminsCount = this.identityStore.countActiveAdmins();
      if (activeAdminsCount <= 1) {
        throw new Error(
          'Administrator Safety Violation: Cannot deactivate, suspend, or reject the last active QSHE Admin account.'
        );
      }
    }

    const previousStatus = target.status;
    target.status = newStatus;
    this.identityStore.updateUser(target);

    this.auditRepo.record({
      actorId: adminUser.id,
      actorName: adminUser.fullName,
      actorNoreg: adminUser.noreg,
      actorRole: adminUser.role,
      targetUserId: target.id,
      targetUserName: target.fullName,
      targetUserNoreg: target.noreg,
      action: 'ACCOUNT_STATUS_CHANGED',
      details: `Updated account lifecycle status from ${previousStatus} to ${newStatus}.`,
      previousValue: previousStatus,
      newValue: newStatus,
    });

    return {
      id: target.id,
      noreg: target.noreg,
      fullName: target.fullName,
      email: target.email,
      department: target.department,
      section: target.section,
      position: target.position,
      role: target.role,
      areaAccess: target.areaAccess,
      status: target.status,
    };
  }

  /**
   * Area Access Authorization Check
   * Crucial rule: An empty Area Access assignment must NOT automatically grant access to all areas.
   */
  public hasAreaAccess(user: AuthUser, areaId: string): boolean {
    if (!user.areaAccess || user.areaAccess.length === 0) {
      return false;
    }
    return user.areaAccess.includes(areaId);
  }

  public getAuditLogs(): AuditLogEntry[] {
    return this.auditRepo.getAll();
  }

  public recordAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    return this.auditRepo.record(entry);
  }

  public logAuditAction(
    actor: AuthUser,
    action: AuditActionType,
    targetId: string,
    refNo: string,
    details: string
  ): AuditLogEntry {
    return this.auditRepo.record({
      actorId: actor.id,
      actorName: actor.fullName,
      actorNoreg: actor.noreg,
      actorRole: actor.role,
      targetUserId: targetId,
      targetUserName: refNo,
      targetUserNoreg: refNo,
      action,
      details,
    });
  }
}

export const authService = new MockAuthService();
