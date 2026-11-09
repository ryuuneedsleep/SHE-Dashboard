/**
 * SPLD SAFETY - Safety Service (Module 05)
 * Central operational service for Safety Patrols & Safety Findings.
 * Enforces:
 * - Two independent creation pathways: DIRECT vs PATROL
 * - Universal Anti Self-Approval protection (All roles including QSHE_ADMIN)
 * - Strict Area Access restrictions for Approvers
 * - Non-duplicate checklist item finding linkage
 * - Complete status lifecycle including 'Accepted'
 * - Mandatory rejection reasons & audit logging
 */

import type { AuthUser } from '../types/auth.ts';
import type {
  SafetyFindingRecord,
  SafetyPatrolRecord,
  FindingFilters,
  PatrolFilters,
  CreateDirectFindingInput,
  CreatePatrolFindingInput,
  CreatePatrolInput,
  FindingLifecycleStatus,
  PatrolChecklistItem,
  ChecklistItemStatus,
} from '../types/safety.ts';
import { SEED_FINDINGS, SEED_PATROLS } from '../data/dashboardSeeds.ts';
import { masterDataService } from './masterDataService.ts';
import { authService } from './authService.ts';
import { dashboardService } from './dashboardService.ts';

export class SafetyService {
  private findings: SafetyFindingRecord[] = [];
  private patrols: SafetyPatrolRecord[] = [];

  constructor() {
    this.initSeeds();
  }

  private initSeeds(): void {
    // 1. Initialize Patrols from seeds with standardized checklists
    this.patrols = SEED_PATROLS.map((sp, idx) => {
      const defaultChecklist: PatrolChecklistItem[] = [
        {
          id: `chk-${sp.id}-1`,
          label: 'Jalur pejalan kaki (pedestrian walkway) bebas hambatan & marka lantai terlihat jelas',
          category: '5S & Housekeeping',
          isMandatory: true,
          status: sp.status === 'Completed' ? 'OK' : 'UNCHECKED',
        },
        {
          id: `chk-${sp.id}-2`,
          label: 'Alat Pemadam Api Ringan (APAR) & Kotak P3K tidak terhalang barang/palet',
          category: 'Fire & Emergency',
          isMandatory: true,
          status: sp.status === 'Completed' ? (idx === 0 ? 'NOT_OK' : 'OK') : 'UNCHECKED',
          relatedFindingId: sp.status === 'Completed' && idx === 0 ? 'fnd-004' : null,
          relatedFindingRefNo: sp.status === 'Completed' && idx === 0 ? 'FND-2026-0004' : null,
        },
        {
          id: `chk-${sp.id}-3`,
          label: 'Operator forklift & reach truck menggunakan sabuk pengaman (seatbelt) & APD lengkap',
          category: 'Mobile Equipment & PPE',
          isMandatory: true,
          status: sp.status === 'Completed' ? (idx === 1 ? 'NOT_OK' : 'OK') : 'UNCHECKED',
          relatedFindingId: sp.status === 'Completed' && idx === 1 ? 'fnd-003' : null,
          relatedFindingRefNo: sp.status === 'Completed' && idx === 1 ? 'FND-2026-0003' : null,
        },
        {
          id: `chk-${sp.id}-4`,
          label: 'Susunan palet stabil, tidak miring, dan tidak melebihi kapasitas beban maksimum rak',
          category: 'Storage & Stacking',
          isMandatory: true,
          status: sp.status === 'Completed' ? 'OK' : 'UNCHECKED',
        },
        {
          id: `chk-${sp.id}-5`,
          label: 'Penerangan lorong kerja & ventilasi udara memadai',
          category: 'Environment & Ergonomics',
          isMandatory: false,
          status: sp.status === 'Completed' ? 'OK' : 'UNCHECKED',
        },
      ];

      return {
        id: sp.id,
        referenceNo: sp.referenceNo,
        patrolName: sp.patrolName,
        description: `Inspeksi keselamatan operasional terjadwal pada ${sp.operationalAreaName}`,
        plannedDate: sp.plannedDate,
        conductedDate: sp.conductedDate || null,
        departmentId: sp.departmentId,
        departmentName: sp.departmentName,
        operationalAreaId: sp.operationalAreaId,
        operationalAreaName: sp.operationalAreaName,
        leaderNoreg: sp.leaderNoreg,
        leaderName: sp.leaderName,
        assignedTeam: [
          { noreg: sp.leaderNoreg, name: sp.leaderName, role: 'Patrol Leader' },
          { noreg: 'TAM-8805', name: 'Rian Pratama', role: 'Inspector' },
        ],
        status: sp.status,
        checklist: defaultChecklist,
        findingsCount: sp.findingsCount,
        relatedFindingIds: idx === 0 ? ['fnd-004'] : idx === 1 ? ['fnd-003'] : [],
        createdByNoreg: 'TAM-8801',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    // 2. Initialize Findings from seeds with dual-source classification
    this.findings = SEED_FINDINGS.map((sf, idx) => {
      const isPatrolSource = idx % 3 === 0; // Distribute between DIRECT and PATROL
      const parentPatrol = isPatrolSource ? this.patrols[idx % this.patrols.length] : null;

      let lifecycleStatus: FindingLifecycleStatus;
      if (sf.status === 'In Progress') lifecycleStatus = 'In Progress';
      else if (sf.status === 'Resolved') lifecycleStatus = 'Resolved';
      else if (sf.status === 'Closed') lifecycleStatus = 'Closed';
      else if (sf.status === 'Under Review') lifecycleStatus = 'Under Review';
      else if (idx === 1) lifecycleStatus = 'Accepted';
      else lifecycleStatus = 'Submitted';

      return {
        id: sf.id,
        referenceNo: sf.referenceNo,
        title: sf.title,
        description: sf.description,
        source: isPatrolSource ? 'PATROL' : 'DIRECT',
        patrolId: parentPatrol ? parentPatrol.id : null,
        patrolRefNo: parentPatrol ? parentPatrol.referenceNo : null,
        checklistItemId: parentPatrol ? `chk-${parentPatrol.id}-2` : null,
        departmentId: sf.departmentId,
        departmentName: sf.departmentName,
        sectionId: sf.sectionId,
        sectionName: sf.sectionName,
        operationalAreaId: sf.operationalAreaId,
        operationalAreaName: sf.operationalAreaName,
        locationDetails: `Zona ${sf.operationalAreaName}, Lorong A-${idx + 1}`,
        categoryId: sf.categoryId,
        categoryName: sf.categoryName,
        hazardCategoryId: 'haz-phy',
        hazardCategoryName: 'Physical & Mechanical Hazard',
        riskLevelId: sf.riskLevelId,
        riskLevelName: sf.riskLevelName,
        riskDisplayColor:
          sf.riskLevelId === 'rl-crt'
            ? '#B91C1C'
            : sf.riskLevelId === 'rl-hi'
              ? '#EF4444'
              : sf.riskLevelId === 'rl-med'
                ? '#F59E0B'
                : '#10B981',
        evidence: {
          fileName: `evidence_${sf.referenceNo}.jpg`,
          fileSize: 1024 * 350,
          fileType: 'image/jpeg',
          previewUrl: '/pwa-192x192.svg',
          uploadedAt: sf.reportedAt,
        },
        reportedByNoreg: sf.reportedByNoreg,
        reportedByName: sf.reportedByName,
        reportedByDepartment: sf.departmentName,
        reportedAt: sf.reportedAt,
        status: lifecycleStatus,
        reviewHistory: [
          {
            id: `rev-${sf.id}-1`,
            timestamp: sf.reportedAt,
            actorNoreg: sf.reportedByNoreg,
            actorName: sf.reportedByName,
            actorRole: 'MEMBER',
            previousStatus: 'Draft',
            newStatus: 'Submitted',
            notes: 'Laporan temuan pertama kali disubmit ke sistem.',
          },
        ],
        createdAt: sf.reportedAt,
        updatedAt: sf.reportedAt,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // FINDINGS ACCESS & FILTERING
  // ---------------------------------------------------------------------------

  public getAllFindings(): SafetyFindingRecord[] {
    return [...this.findings];
  }

  public getFindings(actor: AuthUser, filters?: FindingFilters): SafetyFindingRecord[] {
    let scoped = [...this.findings];

    // Role-based visibility scoping
    if (actor.role === 'MEMBER') {
      scoped = scoped.filter((f) => f.reportedByNoreg === actor.noreg);
    } else if (actor.role === 'APPROVER') {
      const allowedAreas = actor.areaAccess || [];
      scoped = scoped.filter((f) => allowedAreas.includes(f.operationalAreaId));
    }
    // QSHE_ADMIN and MANAGEMENT have division-wide visibility

    if (!filters) return scoped;

    return scoped.filter((f) => {
      // 1. Search Query
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchesQ =
          f.title.toLowerCase().includes(q) ||
          f.referenceNo.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.reportedByName.toLowerCase().includes(q) ||
          f.operationalAreaName.toLowerCase().includes(q);
        if (!matchesQ) return false;
      }

      // 2. Source Filter
      if (filters.source && filters.source !== 'ALL') {
        if (f.source !== filters.source) return false;
      }

      // 3. Status Filter
      if (filters.status && filters.status !== 'ALL') {
        if (f.status !== filters.status) return false;
      }

      // 4. Department Filter
      if (filters.departmentId && filters.departmentId !== 'ALL') {
        if (f.departmentId !== filters.departmentId) return false;
      }

      // 5. Operational Area Filter
      if (filters.operationalAreaId && filters.operationalAreaId !== 'ALL') {
        if (f.operationalAreaId !== filters.operationalAreaId) return false;
      }

      // 6. Finding Category Filter
      if (filters.categoryId && filters.categoryId !== 'ALL') {
        if (f.categoryId !== filters.categoryId) return false;
      }

      // 7. Risk Level Filter
      if (filters.riskLevelId && filters.riskLevelId !== 'ALL') {
        if (f.riskLevelId !== filters.riskLevelId) return false;
      }

      // 8. Date Range Filter
      if (filters.startDate) {
        if (new Date(f.reportedAt) < new Date(filters.startDate + 'T00:00:00')) return false;
      }
      if (filters.endDate) {
        if (new Date(f.reportedAt) > new Date(filters.endDate + 'T23:59:59.999')) return false;
      }

      return true;
    });
  }

  public getMyFindings(actor: AuthUser, filters?: FindingFilters): SafetyFindingRecord[] {
    const personalFilters: FindingFilters = {
      ...filters,
    };
    return this.getFindings(actor, personalFilters).filter(
      (f) => f.reportedByNoreg === actor.noreg
    );
  }

  public getFindingById(id: string): SafetyFindingRecord | undefined {
    return this.findings.find((f) => f.id === id || f.referenceNo === id);
  }

  // ---------------------------------------------------------------------------
  // FINDINGS CREATION (DIRECT & PATROL)
  // ---------------------------------------------------------------------------

  private generateFindingReference(): string {
    const currentYear = new Date().getFullYear();
    const nextSeq = this.findings.length + 1;
    return `FND-${currentYear}-${String(nextSeq).padStart(4, '0')}`;
  }

  public createDirectFinding(
    actor: AuthUser,
    input: CreateDirectFindingInput
  ): SafetyFindingRecord {
    const referenceNo = this.generateFindingReference();
    const id = `fnd-${Date.now()}`;

    // Resolve Master Data Names (Module 03 single source of truth)
    const dept = masterDataService.getById('departments', input.departmentId);
    const sec = masterDataService.getById('sections', input.sectionId);
    const area = masterDataService.getById('operational_areas', input.operationalAreaId);
    const cat = masterDataService.getById('finding_categories', input.categoryId);
    const risk = masterDataService.getById('risk_levels', input.riskLevelId);
    const hazard = input.hazardCategoryId
      ? masterDataService.getById('hazard_categories', input.hazardCategoryId)
      : undefined;
    const incident = input.incidentTypeId
      ? masterDataService.getById('incident_types', input.incidentTypeId)
      : undefined;

    const now = new Date().toISOString();

    const newFinding: SafetyFindingRecord = {
      id,
      referenceNo,
      title: input.title.trim(),
      description: input.description.trim(),
      source: 'DIRECT',
      patrolId: null,
      patrolRefNo: null,
      checklistItemId: null,

      departmentId: input.departmentId,
      departmentName: dept?.name || 'Warehouse',
      sectionId: input.sectionId,
      sectionName: sec?.name || 'General Area',
      operationalAreaId: input.operationalAreaId,
      operationalAreaName: area?.name || 'Warehouse Floor',
      locationDetails: input.locationDetails?.trim(),

      categoryId: input.categoryId,
      categoryName: cat?.name || 'Unsafe Condition',
      hazardCategoryId: input.hazardCategoryId,
      hazardCategoryName: hazard?.name,
      riskLevelId: input.riskLevelId,
      riskLevelName: risk?.name || 'Medium Risk',
      riskDisplayColor: (risk && 'displayColor' in risk) ? (risk.displayColor as string) : '#F59E0B',
      incidentTypeId: input.incidentTypeId,
      incidentTypeName: incident?.name,

      evidence: input.evidence || null,

      // Reporter Session Identity Lock
      reportedByNoreg: actor.noreg,
      reportedByName: actor.fullName,
      reportedByDepartment: actor.department,
      reportedAt: now,

      status: 'Submitted',
      reviewHistory: [
        {
          id: `rev-${id}-0`,
          timestamp: now,
          actorNoreg: actor.noreg,
          actorName: actor.fullName,
          actorRole: actor.role,
          previousStatus: 'Draft',
          newStatus: 'Submitted',
          notes: 'Direct safety finding reported by user.',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.findings.unshift(newFinding);

    // Synchronize with Module 04 Dashboard
    dashboardService.syncFromSafetyFinding(newFinding);

    // Record Centralized Audit Log
    authService.logAuditAction(
      actor,
      'DIRECT_FINDING_CREATED',
      newFinding.id,
      newFinding.referenceNo,
      `Direct Finding created: ${newFinding.title} in ${newFinding.operationalAreaName}`
    );

    return newFinding;
  }

  public createPatrolFinding(
    actor: AuthUser,
    input: CreatePatrolFindingInput
  ): SafetyFindingRecord {
    const patrol = this.patrols.find((p) => p.id === input.patrolId);
    if (!patrol) {
      throw new Error(`Referenced Safety Patrol ID "${input.patrolId}" does not exist.`);
    }

    // Permission check for patrol finding
    if (actor.role === 'APPROVER') {
      const allowedAreas = actor.areaAccess || [];
      if (!allowedAreas.includes(patrol.operationalAreaId)) {
        throw new Error('Unauthorized: You cannot add findings to a patrol outside your assigned operational area.');
      }
    }

    const referenceNo = this.generateFindingReference();
    const id = `fnd-${Date.now()}`;

    // Resolve Master Data Names
    const dept = masterDataService.getById('departments', input.departmentId);
    const sec = masterDataService.getById('sections', input.sectionId);
    const area = masterDataService.getById('operational_areas', input.operationalAreaId);
    const cat = masterDataService.getById('finding_categories', input.categoryId);
    const risk = masterDataService.getById('risk_levels', input.riskLevelId);
    const hazard = input.hazardCategoryId
      ? masterDataService.getById('hazard_categories', input.hazardCategoryId)
      : undefined;
    const incident = input.incidentTypeId
      ? masterDataService.getById('incident_types', input.incidentTypeId)
      : undefined;

    const now = new Date().toISOString();

    const newFinding: SafetyFindingRecord = {
      id,
      referenceNo,
      title: input.title.trim(),
      description: input.description.trim(),
      source: 'PATROL',
      patrolId: patrol.id,
      patrolRefNo: patrol.referenceNo,
      checklistItemId: input.checklistItemId || null,

      departmentId: input.departmentId,
      departmentName: dept?.name || patrol.departmentName,
      sectionId: input.sectionId,
      sectionName: sec?.name || patrol.sectionName || 'Operational Area',
      operationalAreaId: input.operationalAreaId,
      operationalAreaName: area?.name || patrol.operationalAreaName,
      locationDetails: input.locationDetails?.trim(),

      categoryId: input.categoryId,
      categoryName: cat?.name || 'Unsafe Condition',
      hazardCategoryId: input.hazardCategoryId,
      hazardCategoryName: hazard?.name,
      riskLevelId: input.riskLevelId,
      riskLevelName: risk?.name || 'High Risk',
      riskDisplayColor: (risk && 'displayColor' in risk) ? (risk.displayColor as string) : '#EF4444',
      incidentTypeId: input.incidentTypeId,
      incidentTypeName: incident?.name,

      evidence: input.evidence || null,

      // Reporter Session Identity Lock
      reportedByNoreg: actor.noreg,
      reportedByName: actor.fullName,
      reportedByDepartment: actor.department,
      reportedAt: now,

      status: 'Submitted',
      reviewHistory: [
        {
          id: `rev-${id}-0`,
          timestamp: now,
          actorNoreg: actor.noreg,
          actorName: actor.fullName,
          actorRole: actor.role,
          previousStatus: 'Draft',
          newStatus: 'Submitted',
          notes: `Patrol Finding reported from Patrol #${patrol.referenceNo}.`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.findings.unshift(newFinding);

    // Bi-directional link with originating patrol
    patrol.findingsCount += 1;
    patrol.relatedFindingIds.push(newFinding.id);

    // If originated from a specific checklist item, link and flag NOT_OK
    if (input.checklistItemId) {
      const chk = patrol.checklist.find((c) => c.id === input.checklistItemId);
      if (chk) {
        chk.status = 'NOT_OK';
        chk.relatedFindingId = newFinding.id;
        chk.relatedFindingRefNo = newFinding.referenceNo;
      }
    }

    patrol.updatedAt = now;

    // Synchronize with Module 04 Dashboard
    dashboardService.syncFromSafetyFinding(newFinding);
    dashboardService.syncFromSafetyPatrol(patrol);

    // Record Centralized Audit Log
    authService.logAuditAction(
      actor,
      'PATROL_FINDING_CREATED',
      newFinding.id,
      newFinding.referenceNo,
      `Finding recorded during Patrol ${patrol.referenceNo}: ${newFinding.title}`
    );

    return newFinding;
  }

  // ---------------------------------------------------------------------------
  // FINDINGS REVIEW & LIFECYCLE (WITH UNIVERSAL ANTI SELF-APPROVAL)
  // ---------------------------------------------------------------------------

  public reviewFinding(
    actor: AuthUser,
    findingId: string,
    targetStatus: FindingLifecycleStatus,
    notes?: string,
    rejectionReason?: string
  ): SafetyFindingRecord {
    const finding = this.findings.find((f) => f.id === findingId || f.referenceNo === findingId);
    if (!finding) {
      throw new Error(`Finding ID "${findingId}" not found.`);
    }

    // 1. UNIVERSAL ANTI SELF-APPROVAL CHECK (MEMBER, APPROVER, QSHE_ADMIN)
    if (finding.reportedByNoreg === actor.noreg) {
      throw new Error(
        'Self-approval is strictly prohibited. Users cannot approve or conduct review on findings they reported themselves.'
      );
    }

    // 2. Role Authorization Check
    if (actor.role === 'MEMBER') {
      throw new Error('Unauthorized: Members cannot review or approve safety findings.');
    }

    if (actor.role === 'MANAGEMENT') {
      throw new Error('Unauthorized: Management role has read-only access to findings review.');
    }

    // 3. Area Access Authorization Check for Approvers
    if (actor.role === 'APPROVER') {
      const allowedAreas = actor.areaAccess || [];
      if (!allowedAreas.includes(finding.operationalAreaId)) {
        throw new Error(
          `Unauthorized: You do not have Area Access authorization for area "${finding.operationalAreaName}".`
        );
      }
    }

    // 4. Rejection Reason Validation
    if (targetStatus === 'Rejected') {
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new Error('Rejection reason is mandatory when rejecting a safety finding.');
      }
    }

    const previousStatus = finding.status;
    const now = new Date().toISOString();

    // 5. Update Record State
    finding.status = targetStatus;
    finding.updatedAt = now;
    if (targetStatus === 'Rejected' && rejectionReason) {
      finding.rejectionReason = rejectionReason.trim();
    }

    // Append Audit Review History
    finding.reviewHistory.push({
      id: `rev-${finding.id}-${finding.reviewHistory.length + 1}`,
      timestamp: now,
      actorNoreg: actor.noreg,
      actorName: actor.fullName,
      actorRole: actor.role,
      previousStatus,
      newStatus: targetStatus,
      notes: notes?.trim(),
      rejectionReason: targetStatus === 'Rejected' ? rejectionReason?.trim() : undefined,
    });

    // Record Centralized Audit Log
    authService.logAuditAction(
      actor,
      targetStatus === 'Rejected' ? 'FINDING_REJECTED' : 'FINDING_STATUS_CHANGED',
      finding.id,
      finding.referenceNo,
      `Status changed from ${previousStatus} to ${targetStatus}${
        targetStatus === 'Rejected' ? ` (Reason: ${rejectionReason})` : ''
      }`
    );

    // Synchronize with Module 04 Dashboard
    dashboardService.syncFromSafetyFinding(finding);

    return finding;
  }

  // ---------------------------------------------------------------------------
  // SAFETY PATROL OPERATIONS
  // ---------------------------------------------------------------------------

  public getPatrols(actor: AuthUser, filters?: PatrolFilters): SafetyPatrolRecord[] {
    let scoped = [...this.patrols];

    // Approver scope restriction
    if (actor.role === 'APPROVER') {
      const allowedAreas = actor.areaAccess || [];
      scoped = scoped.filter((p) => allowedAreas.includes(p.operationalAreaId));
    }

    if (!filters) return scoped;

    return scoped.filter((p) => {
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchesQ =
          p.patrolName.toLowerCase().includes(q) ||
          p.referenceNo.toLowerCase().includes(q) ||
          p.leaderName.toLowerCase().includes(q) ||
          p.operationalAreaName.toLowerCase().includes(q);
        if (!matchesQ) return false;
      }

      if (filters.status && filters.status !== 'ALL') {
        if (p.status !== filters.status) return false;
      }

      if (filters.departmentId && filters.departmentId !== 'ALL') {
        if (p.departmentId !== filters.departmentId) return false;
      }

      if (filters.operationalAreaId && filters.operationalAreaId !== 'ALL') {
        if (p.operationalAreaId !== filters.operationalAreaId) return false;
      }

      if (filters.startDate) {
        if (p.plannedDate < filters.startDate) return false;
      }

      if (filters.endDate) {
        if (p.plannedDate > filters.endDate) return false;
      }

      return true;
    });
  }

  public getPatrolById(id: string): SafetyPatrolRecord | undefined {
    return this.patrols.find((p) => p.id === id || p.referenceNo === id);
  }

  public createPatrol(actor: AuthUser, input: CreatePatrolInput): SafetyPatrolRecord {
    if (actor.role === 'MEMBER' || actor.role === 'MANAGEMENT') {
      throw new Error('Unauthorized: Only QSHE Admin or Area Approvers can schedule safety patrols.');
    }

    if (actor.role === 'APPROVER') {
      const allowedAreas = actor.areaAccess || [];
      if (!allowedAreas.includes(input.operationalAreaId)) {
        throw new Error('Unauthorized: Cannot create patrol outside your assigned operational area.');
      }
    }

    const currentYear = new Date().getFullYear();
    const nextSeq = this.patrols.length + 1;
    const referenceNo = `PTR-${currentYear}-${String(nextSeq).padStart(4, '0')}`;
    const id = `ptr-${Date.now()}`;

    const dept = masterDataService.getById('departments', input.departmentId);
    const area = masterDataService.getById('operational_areas', input.operationalAreaId);
    const sec = input.sectionId ? masterDataService.getById('sections', input.sectionId) : undefined;

    // Use provided checklist items or default standard 5S checklist
    const checklist: PatrolChecklistItem[] = input.checklistItems?.length
      ? input.checklistItems.map((c, i) => ({
          id: `chk-${id}-${i + 1}`,
          label: c.label,
          category: c.category,
          isMandatory: c.isMandatory,
          status: 'UNCHECKED',
        }))
      : [
          {
            id: `chk-${id}-1`,
            label: 'Jalur lalu lintas forklift dan pejalan kaki bebas dari tumpahan oli dan penghalang',
            category: '5S & Housekeeping',
            isMandatory: true,
            status: 'UNCHECKED',
          },
          {
            id: `chk-${id}-2`,
            label: 'Akses darurat, pintu evakuasi, dan APAR dalam radius 1 meter bebas hambatan',
            category: 'Fire & Emergency',
            isMandatory: true,
            status: 'UNCHECKED',
          },
          {
            id: `chk-${id}-3`,
            label: 'Operator mengenakan APD standar (Safety Shoes, Helmet, Vest) dengan benar',
            category: 'PPE Compliance',
            isMandatory: true,
            status: 'UNCHECKED',
          },
          {
            id: `chk-${id}-4`,
            label: 'Kondisi fisik rak penyimpanan tidak ada lekukan / benturan parah',
            category: 'Storage Integrity',
            isMandatory: false,
            status: 'UNCHECKED',
          },
        ];

    const now = new Date().toISOString();

    const newPatrol: SafetyPatrolRecord = {
      id,
      referenceNo,
      patrolName: input.patrolName.trim(),
      description: input.description?.trim(),
      plannedDate: input.plannedDate,
      conductedDate: null,
      departmentId: input.departmentId,
      departmentName: dept?.name || 'Warehouse',
      sectionId: input.sectionId,
      sectionName: sec?.name,
      operationalAreaId: input.operationalAreaId,
      operationalAreaName: area?.name || 'Operational Zone',
      leaderNoreg: input.leaderNoreg,
      leaderName: input.leaderName,
      assignedTeam: input.assignedTeam?.length
        ? input.assignedTeam
        : [{ noreg: input.leaderNoreg, name: input.leaderName, role: 'Patrol Leader' }],
      status: 'Planned',
      checklist,
      findingsCount: 0,
      relatedFindingIds: [],
      createdByNoreg: actor.noreg,
      createdAt: now,
      updatedAt: now,
    };

    this.patrols.unshift(newPatrol);

    // Synchronize with Module 04 Dashboard
    dashboardService.syncFromSafetyPatrol(newPatrol);

    authService.logAuditAction(
      actor,
      'PATROL_SCHEDULED',
      newPatrol.id,
      newPatrol.referenceNo,
      `Patrol scheduled: "${newPatrol.patrolName}" in ${newPatrol.operationalAreaName}`
    );

    return newPatrol;
  }

  public updatePatrolChecklist(
    actor: AuthUser,
    patrolId: string,
    checkItemId: string,
    status: ChecklistItemStatus,
    notes?: string
  ): SafetyPatrolRecord {
    const patrol = this.patrols.find((p) => p.id === patrolId || p.referenceNo === patrolId);
    if (!patrol) {
      throw new Error(`Patrol ID "${patrolId}" not found.`);
    }

    if (actor.role === 'APPROVER') {
      const allowedAreas = actor.areaAccess || [];
      if (!allowedAreas.includes(patrol.operationalAreaId)) {
        throw new Error('Unauthorized: You cannot modify checklist outside your assigned operational area.');
      }
    }

    if (patrol.status === 'Completed' || patrol.status === 'Cancelled') {
      throw new Error(`Cannot modify checklist of a ${patrol.status} patrol.`);
    }

    const item = patrol.checklist.find((c) => c.id === checkItemId);
    if (!item) {
      throw new Error(`Checklist item "${checkItemId}" not found in patrol.`);
    }

    item.status = status;
    if (notes !== undefined) {
      item.notes = notes.trim();
    }

    // Automatically transition to 'In Progress' if currently 'Planned' or 'Assigned'
    if (patrol.status === 'Planned' || patrol.status === 'Assigned') {
      patrol.status = 'In Progress';
    }

    patrol.updatedAt = new Date().toISOString();
    return patrol;
  }

  public completePatrol(
    actor: AuthUser,
    patrolId: string,
    generalObservations?: string
  ): SafetyPatrolRecord {
    const patrol = this.patrols.find((p) => p.id === patrolId || p.referenceNo === patrolId);
    if (!patrol) {
      throw new Error(`Patrol ID "${patrolId}" not found.`);
    }

    // Integrity check: Mandatory checklist items cannot be UNCHECKED
    const uncheckedMandatory = patrol.checklist.filter(
      (c) => c.isMandatory && c.status === 'UNCHECKED'
    );
    if (uncheckedMandatory.length > 0) {
      throw new Error(
        `Cannot complete patrol: ${uncheckedMandatory.length} mandatory checklist item(s) are still UNCHECKED.`
      );
    }

    const now = new Date().toISOString();
    patrol.status = 'Completed';
    patrol.conductedDate = now;
    if (generalObservations !== undefined) {
      patrol.generalObservations = generalObservations.trim();
    }
    patrol.updatedAt = now;

    // Synchronize with Module 04 Dashboard
    dashboardService.syncFromSafetyPatrol(patrol);

    authService.logAuditAction(
      actor,
      'PATROL_COMPLETED',
      patrol.id,
      patrol.referenceNo,
      `Patrol completed with ${patrol.findingsCount} findings recorded.`
    );

    return patrol;
  }

  public cancelPatrol(actor: AuthUser, patrolId: string, reason: string): SafetyPatrolRecord {
    const patrol = this.patrols.find((p) => p.id === patrolId || p.referenceNo === patrolId);
    if (!patrol) {
      throw new Error(`Patrol ID "${patrolId}" not found.`);
    }

    if (!reason || !reason.trim()) {
      throw new Error('Cancellation reason is mandatory.');
    }

    patrol.status = 'Cancelled';
    patrol.generalObservations = `Dibatalkan: ${reason.trim()}`;
    patrol.updatedAt = new Date().toISOString();

    // Synchronize with Module 04 Dashboard
    dashboardService.syncFromSafetyPatrol(patrol);

    authService.logAuditAction(
      actor,
      'PATROL_CANCELLED',
      patrol.id,
      patrol.referenceNo,
      `Patrol cancelled: ${reason.trim()}`
    );

    return patrol;
  }
}

export const safetyService = new SafetyService();
