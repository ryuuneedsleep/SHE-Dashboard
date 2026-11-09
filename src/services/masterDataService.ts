/**
 * SPLD SAFETY - Master Data Management Service
 * Centralized Single Source of Truth for Organizational & Safety Master Data.
 * Strictly governed by QSHE Admin with referential integrity checks and audit logging.
 */

import type { AuthUser } from '../types/auth';
import type {
  MasterDataCategory,
  MasterDataStatus,
  MasterRecord,
  BaseMasterRecord,
  DepartmentRecord,
  SectionRecord,
  PositionRecord,
  OperationalAreaRecord,
  SafetyCategoryRecord,
  HazardCategoryRecord,
  FindingCategoryRecord,
  RiskLevelRecord,
  IncidentTypeRecord,
  CorrectiveActionCategoryRecord,
  InUseCheckResult,
} from '../types/masterData';
import {
  SEED_DEPARTMENTS,
  SEED_SECTIONS,
  SEED_POSITIONS,
  SEED_OPERATIONAL_AREAS,
  SEED_SAFETY_CATEGORIES,
  SEED_HAZARD_CATEGORIES,
  SEED_FINDING_CATEGORIES,
  SEED_RISK_LEVELS,
  SEED_INCIDENT_TYPES,
  SEED_CORRECTIVE_ACTIONS,
} from '../data/masterDataSeeds.ts';
import { authService } from './authService.ts';

export class MasterDataService {
  private departments: DepartmentRecord[] = [...SEED_DEPARTMENTS];
  private sections: SectionRecord[] = [...SEED_SECTIONS];
  private positions: PositionRecord[] = [...SEED_POSITIONS];
  private operationalAreas: OperationalAreaRecord[] = [...SEED_OPERATIONAL_AREAS];
  private safetyCategories: SafetyCategoryRecord[] = [...SEED_SAFETY_CATEGORIES];
  private hazardCategories: HazardCategoryRecord[] = [...SEED_HAZARD_CATEGORIES];
  private findingCategories: FindingCategoryRecord[] = [...SEED_FINDING_CATEGORIES];
  private riskLevels: RiskLevelRecord[] = [...SEED_RISK_LEVELS];
  private incidentTypes: IncidentTypeRecord[] = [...SEED_INCIDENT_TYPES];
  private correctiveActions: CorrectiveActionCategoryRecord[] = [
    ...SEED_CORRECTIVE_ACTIONS,
  ];

  private getCollection(category: MasterDataCategory): MasterRecord[] {
    switch (category) {
      case 'departments':
        return this.departments;
      case 'sections':
        return this.sections;
      case 'positions':
        return this.positions;
      case 'operational_areas':
        return this.operationalAreas;
      case 'safety_categories':
        return this.safetyCategories;
      case 'hazard_categories':
        return this.hazardCategories;
      case 'finding_categories':
        return this.findingCategories;
      case 'risk_levels':
        return this.riskLevels;
      case 'incident_types':
        return this.incidentTypes;
      case 'corrective_action_categories':
        return this.correctiveActions;
      default:
        return [];
    }
  }

  // -------------------------------------------------------------------------
  // Access Control
  // -------------------------------------------------------------------------
  private verifyAdminAuthority(actor: AuthUser): void {
    if (actor.role !== 'QSHE_ADMIN') {
      throw new Error(
        'Access Denied: Only QSHE Admin possesses authorization to manage Master Data.'
      );
    }
    if (actor.status !== 'Active') {
      throw new Error('Access Denied: Inactive administrator account.');
    }
  }

  // -------------------------------------------------------------------------
  // Public Retrieval Methods
  // -------------------------------------------------------------------------
  public getAll(category: MasterDataCategory): MasterRecord[] {
    return [...this.getCollection(category)];
  }

  public getActive(category: MasterDataCategory): MasterRecord[] {
    return this.getCollection(category).filter((r) => r.status === 'Active');
  }

  public getById(
    category: MasterDataCategory,
    id: string
  ): MasterRecord | undefined {
    return this.getCollection(category).find(
      (r) => r.id.toLowerCase() === id.toLowerCase()
    );
  }

  // -------------------------------------------------------------------------
  // Duplicate Code Validation
  // -------------------------------------------------------------------------
  public isCodeDuplicate(
    category: MasterDataCategory,
    code: string,
    excludeId?: string
  ): boolean {
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return false;
    return this.getCollection(category).some(
      (r) =>
        r.code.trim().toLowerCase() === trimmed &&
        (!excludeId || r.id.toLowerCase() !== excludeId.toLowerCase())
    );
  }

  // -------------------------------------------------------------------------
  // Referential Integrity & In-Use Reference Checks
  // -------------------------------------------------------------------------
  public checkInUse(
    category: MasterDataCategory,
    id: string
  ): InUseCheckResult {
    const record = this.getById(category, id);
    if (!record) {
      return { isInUse: false, canDeactivate: true, referenceCount: 0 };
    }

    const allUsers = authService.getAllUsers();
    const pendingRegs = authService.getPendingRegistrations();

    // 1. Department checks
    if (category === 'departments') {
      const activeChildSections = this.sections.filter(
        (s) => s.departmentId === id && s.status === 'Active'
      );
      if (activeChildSections.length > 0) {
        return {
          isInUse: true,
          canDeactivate: false,
          referenceCount: activeChildSections.length,
          reason: `Department has ${activeChildSections.length} active child sections (${activeChildSections
            .map((s) => s.name)
            .slice(0, 3)
            .join(', ')}...). Reassign or deactivate those sections first.`,
        };
      }

      const usersInDept = allUsers.filter(
        (u) => u.department.toLowerCase() === record.name.toLowerCase()
      );
      if (usersInDept.length > 0) {
        return {
          isInUse: true,
          canDeactivate: true,
          referenceCount: usersInDept.length,
          reason: `Notice: ${usersInDept.length} registered personnel belong to this department. Historical user records will retain this department name.`,
        };
      }
    }

    // 2. Section checks
    if (category === 'sections') {
      const usersInSection = allUsers.filter(
        (u) => u.section.toLowerCase() === record.name.toLowerCase()
      );
      const pendingInSection = pendingRegs.filter(
        (r) => r.section.toLowerCase() === record.name.toLowerCase()
      );
      const total = usersInSection.length + pendingInSection.length;
      if (total > 0) {
        return {
          isInUse: true,
          canDeactivate: true,
          referenceCount: total,
          reason: `Notice: ${total} personnel / applicants reference this Section. Deactivating will remove it from future registration options while preserving historical records.`,
        };
      }
    }

    // 3. Position checks
    if (category === 'positions') {
      const usersInPosition = allUsers.filter(
        (u) => u.position.toLowerCase() === record.name.toLowerCase()
      );
      const pendingInPos = pendingRegs.filter(
        (r) => r.position.toLowerCase() === record.name.toLowerCase()
      );
      const total = usersInPosition.length + pendingInPos.length;
      if (total > 0) {
        return {
          isInUse: true,
          canDeactivate: true,
          referenceCount: total,
          reason: `Notice: ${total} personnel / applicants hold this Position. Existing profiles will retain their position title.`,
        };
      }
    }

    // 4. Operational Area checks
    if (category === 'operational_areas') {
      const usersWithArea = allUsers.filter(
        (u) => u.areaAccess && u.areaAccess.includes(record.id)
      );
      if (usersWithArea.length > 0) {
        return {
          isInUse: true,
          canDeactivate: true,
          referenceCount: usersWithArea.length,
          reason: `Notice: ${usersWithArea.length} users have this Operational Area in their Area Access. Deactivation prevents new assignments.`,
        };
      }
    }

    return { isInUse: false, canDeactivate: true, referenceCount: 0 };
  }

  // -------------------------------------------------------------------------
  // Create Record
  // -------------------------------------------------------------------------
  public createRecord<T extends MasterRecord>(
    actor: AuthUser,
    category: MasterDataCategory,
    data: Partial<T>
  ): T {
    this.verifyAdminAuthority(actor);

    const code = (data.code || '').trim().toUpperCase();
    const name = (data.name || '').trim();

    if (!code) throw new Error('Code is mandatory.');
    if (!name) throw new Error('Name is mandatory.');

    if (this.isCodeDuplicate(category, code)) {
      throw new Error(`Code "${code}" is already in use within this master data category.`);
    }

    const now = new Date().toISOString();
    const actorSignature = `${actor.fullName} (${actor.noreg})`;

    const newId =
      data.id?.trim() || `${category.slice(0, 3)}-${Date.now().toString().slice(-6)}`;

    let newRecord: MasterRecord;

    switch (category) {
      case 'sections': {
        const secData = data as Partial<SectionRecord>;
        if (!secData.departmentId) {
          throw new Error('Section must be associated with a Parent Department.');
        }
        const parentDept = this.departments.find(
          (d) => d.id === secData.departmentId
        );
        newRecord = {
          id: newId,
          code,
          name,
          departmentId: secData.departmentId,
          departmentName: parentDept?.name || 'Unknown',
          description: data.description?.trim() || '',
          status: 'Active',
          createdAt: now,
          createdBy: actorSignature,
          updatedAt: now,
          updatedBy: actorSignature,
        } as SectionRecord;
        this.sections.push(newRecord as SectionRecord);
        break;
      }

      case 'operational_areas': {
        const opData = data as Partial<OperationalAreaRecord>;
        newRecord = {
          id: newId,
          code,
          name,
          location: opData.location?.trim() || 'General Warehouse Facility',
          description: data.description?.trim() || '',
          status: 'Active',
          createdAt: now,
          createdBy: actorSignature,
          updatedAt: now,
          updatedBy: actorSignature,
        } as OperationalAreaRecord;
        this.operationalAreas.push(newRecord as OperationalAreaRecord);
        break;
      }

      case 'risk_levels': {
        const rlData = data as Partial<RiskLevelRecord>;
        newRecord = {
          id: newId,
          code,
          name,
          displayColor: rlData.displayColor?.trim() || '#10B981',
          sortOrder: typeof rlData.sortOrder === 'number' ? rlData.sortOrder : 1,
          description: data.description?.trim() || '',
          status: 'Active',
          createdAt: now,
          createdBy: actorSignature,
          updatedAt: now,
          updatedBy: actorSignature,
        } as RiskLevelRecord;
        this.riskLevels.push(newRecord as RiskLevelRecord);
        break;
      }

      default: {
        newRecord = {
          id: newId,
          code,
          name,
          description: data.description?.trim() || '',
          status: 'Active',
          createdAt: now,
          createdBy: actorSignature,
          updatedAt: now,
          updatedBy: actorSignature,
        } as BaseMasterRecord;

        const collection = this.getCollection(category);
        collection.push(newRecord);
        break;
      }
    }

    authService.recordAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorNoreg: actor.noreg,
      actorRole: actor.role,
      targetUserId: newRecord.id,
      targetUserName: `${category}: ${name}`,
      targetUserNoreg: code,
      action: 'MASTER_DATA_CREATED',
      details: `Created new master record [${code}] "${name}" in ${category}.`,
      previousValue: null,
      newValue: name,
    });

    return newRecord as T;
  }

  // -------------------------------------------------------------------------
  // Update Record
  // -------------------------------------------------------------------------
  public updateRecord<T extends MasterRecord>(
    actor: AuthUser,
    category: MasterDataCategory,
    id: string,
    data: Partial<T>
  ): T {
    this.verifyAdminAuthority(actor);

    const existing = this.getById(category, id);
    if (!existing) {
      throw new Error(`Master record with ID "${id}" was not found.`);
    }

    const code = data.code ? data.code.trim().toUpperCase() : existing.code;
    const name = data.name ? data.name.trim() : existing.name;

    if (!code) throw new Error('Code cannot be empty.');
    if (!name) throw new Error('Name cannot be empty.');

    if (this.isCodeDuplicate(category, code, id)) {
      throw new Error(`Code "${code}" is already in use by another record in this category.`);
    }

    const now = new Date().toISOString();
    const actorSignature = `${actor.fullName} (${actor.noreg})`;

    // Apply updates
    existing.code = code;
    existing.name = name;
    if (data.description !== undefined) {
      existing.description = data.description.trim();
    }
    existing.updatedAt = now;
    existing.updatedBy = actorSignature;

    if (category === 'sections') {
      const secRecord = existing as SectionRecord;
      const secData = data as Partial<SectionRecord>;
      if (secData.departmentId && secData.departmentId !== secRecord.departmentId) {
        secRecord.departmentId = secData.departmentId;
        const parentDept = this.departments.find(
          (d) => d.id === secData.departmentId
        );
        secRecord.departmentName = parentDept?.name || 'Unknown';
      }
    }

    if (category === 'operational_areas') {
      const opRecord = existing as OperationalAreaRecord;
      const opData = data as Partial<OperationalAreaRecord>;
      if (opData.location !== undefined) {
        opRecord.location = opData.location.trim();
      }
    }

    if (category === 'risk_levels') {
      const rlRecord = existing as RiskLevelRecord;
      const rlData = data as Partial<RiskLevelRecord>;
      if (rlData.displayColor) {
        rlRecord.displayColor = rlData.displayColor.trim();
      }
      if (typeof rlData.sortOrder === 'number') {
        rlRecord.sortOrder = rlData.sortOrder;
      }
    }

    // Cascade update department name to child sections if department name changed
    if (category === 'departments') {
      this.sections.forEach((s) => {
        if (s.departmentId === existing.id) {
          s.departmentName = existing.name;
        }
      });
    }

    authService.recordAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorNoreg: actor.noreg,
      actorRole: actor.role,
      targetUserId: existing.id,
      targetUserName: `${category}: ${name}`,
      targetUserNoreg: code,
      action: 'MASTER_DATA_UPDATED',
      details: `Updated master record [${code}] "${name}" in ${category}.`,
      previousValue: existing.name,
      newValue: name,
    });

    return existing as T;
  }

  // -------------------------------------------------------------------------
  // Activate / Deactivate (Soft-delete with integrity protection)
  // -------------------------------------------------------------------------
  public toggleStatus(
    actor: AuthUser,
    category: MasterDataCategory,
    id: string,
    newStatus: MasterDataStatus
  ): MasterRecord {
    this.verifyAdminAuthority(actor);

    const record = this.getById(category, id);
    if (!record) {
      throw new Error(`Master record with ID "${id}" was not found.`);
    }

    if (record.status === newStatus) {
      return record;
    }

    if (newStatus === 'Inactive') {
      const check = this.checkInUse(category, id);
      if (!check.canDeactivate) {
        throw new Error(
          check.reason || 'Cannot deactivate this record due to active dependencies.'
        );
      }
    }

    const now = new Date().toISOString();
    const actorSignature = `${actor.fullName} (${actor.noreg})`;

    const previousStatus = record.status;
    record.status = newStatus;
    record.updatedAt = now;
    record.updatedBy = actorSignature;

    authService.recordAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorNoreg: actor.noreg,
      actorRole: actor.role,
      targetUserId: record.id,
      targetUserName: `${category}: ${record.name}`,
      targetUserNoreg: record.code,
      action: 'MASTER_DATA_STATUS_CHANGED',
      details: `Changed status of [${record.code}] "${record.name}" from ${previousStatus} to ${newStatus}.`,
      previousValue: previousStatus,
      newValue: newStatus,
    });

    return record;
  }

  // -------------------------------------------------------------------------
  // Consumer Modules Getters (Active Only)
  // -------------------------------------------------------------------------
  public getActiveDepartments(): DepartmentRecord[] {
    return this.departments.filter((d) => d.status === 'Active');
  }

  public getActiveSections(departmentId?: string): SectionRecord[] {
    return this.sections.filter(
      (s) =>
        s.status === 'Active' &&
        (!departmentId || s.departmentId === departmentId)
    );
  }

  public getActivePositions(): PositionRecord[] {
    return this.positions.filter((p) => p.status === 'Active');
  }

  public getActiveOperationalAreas(): OperationalAreaRecord[] {
    return this.operationalAreas.filter((a) => a.status === 'Active');
  }

  public getActiveRiskLevels(): RiskLevelRecord[] {
    return this.riskLevels
      .filter((r) => r.status === 'Active')
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public getActiveSafetyCategories(): SafetyCategoryRecord[] {
    return this.safetyCategories.filter((c) => c.status === 'Active');
  }

  public getActiveHazardCategories(): HazardCategoryRecord[] {
    return this.hazardCategories.filter((c) => c.status === 'Active');
  }

  public getActiveFindingCategories(): FindingCategoryRecord[] {
    return this.findingCategories.filter((c) => c.status === 'Active');
  }

  public getActiveIncidentTypes(): IncidentTypeRecord[] {
    return this.incidentTypes.filter((c) => c.status === 'Active');
  }

  public getActiveCorrectiveActions(): CorrectiveActionCategoryRecord[] {
    return this.correctiveActions.filter((c) => c.status === 'Active');
  }
}

export const masterDataService = new MasterDataService();
