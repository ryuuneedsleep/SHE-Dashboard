/**
 * SPLD SAFETY - Final Project Refactoring
 * Mock Finding Service
 *
 * In-memory Finding Management with single source of truth based on DEMO_FINDINGS.
 */

import { DEMO_FINDINGS } from '../../data/demoFindings.ts';
import type {
  FindingRecord,
  CreateFindingInput,
  UpdateFindingInput,
  FindingFilters,
  FindingStatus,
} from '../../types/finding.ts';

export class MockFindingService {
  private findings: FindingRecord[] = [];
  private sequenceCounter = 12;

  constructor() {
    this.resetToDemoData();
  }

  public resetToDemoData(): void {
    // Deep clone demo findings to avoid shared mutation
    this.findings = JSON.parse(JSON.stringify(DEMO_FINDINGS));
    this.sequenceCounter = this.findings.length;
  }

  public async getFindings(filters?: FindingFilters): Promise<FindingRecord[]> {
    let result = this.findings.filter((item) => !item.isArchived);

    if (!filters) {
      return [...result];
    }

    // Search filter (referenceNo or title)
    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.referenceNo.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.locationDetail.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filters.status && filters.status !== 'ALL') {
      result = result.filter((item) => item.status === filters.status);
    }

    // Risk level filter
    if (filters.riskLevel && filters.riskLevel !== 'ALL') {
      result = result.filter((item) => item.riskLevel === filters.riskLevel);
    }

    // Finding category filter
    if (filters.findingCategory && filters.findingCategory !== 'ALL') {
      result = result.filter((item) => item.findingCategory === filters.findingCategory);
    }

    // Department filter
    if (filters.department && filters.department !== 'ALL') {
      result = result.filter((item) => item.reporterDepartment === filters.department);
    }

    // Operational Area filter
    if (filters.operationalArea && filters.operationalArea !== 'ALL') {
      result = result.filter((item) => item.operationalArea === filters.operationalArea);
    }

    // Date range filter
    if (filters.startDate) {
      result = result.filter((item) => item.findingDate >= filters.startDate!);
    }
    if (filters.endDate) {
      result = result.filter((item) => item.findingDate <= filters.endDate!);
    }

    // Sort descending by findingDate / createdAt
    return result.sort((a, b) => new Date(b.findingDate).getTime() - new Date(a.findingDate).getTime());
  }

  public async getFindingById(id: string): Promise<FindingRecord | null> {
    const item = this.findings.find((f) => f.id === id);
    if (!item) return null;
    return { ...item };
  }

  public async createFinding(input: CreateFindingInput): Promise<FindingRecord> {
    this.sequenceCounter += 1;
    const padded = String(this.sequenceCounter).padStart(4, '0');
    const referenceNo = `FND-2026-${padded}`;
    const now = new Date().toISOString();

    const newRecord: FindingRecord = {
      id: `fnd-2026-${padded}`,
      referenceNo,
      title: input.title.trim(),
      description: input.description.trim(),
      findingCategory: input.findingCategory,
      hazardCategory: input.hazardCategory,
      riskLevel: input.riskLevel,
      findingDate: input.findingDate,
      reporterName: input.reporterName.trim(),
      reporterDepartment: input.reporterDepartment,
      otherDepartmentName: input.otherDepartmentName?.trim(),
      reporterSection: input.reporterSection.trim(),
      operationalArea: input.operationalArea.trim(),
      locationDetail: input.locationDetail.trim(),
      correctiveAction: input.correctiveAction?.trim(),
      dueDate: input.dueDate,
      status: 'OPEN', // Always starts at OPEN
      evidences: input.evidences ? [...input.evidences] : [],
      createdAt: now,
      updatedAt: now,
      isArchived: false,
    };

    this.findings.unshift(newRecord);
    return { ...newRecord };
  }

  public async updateFinding(id: string, input: UpdateFindingInput): Promise<FindingRecord> {
    const index = this.findings.findIndex((f) => f.id === id);
    if (index === -1) {
      throw new Error(`Finding dengan ID "${id}" tidak ditemukan.`);
    }

    const current = this.findings[index];
    const now = new Date().toISOString();

    const updated: FindingRecord = {
      ...current,
      ...input,
      title: input.title ? input.title.trim() : current.title,
      description: input.description ? input.description.trim() : current.description,
      reporterName: input.reporterName ? input.reporterName.trim() : current.reporterName,
      reporterSection: input.reporterSection ? input.reporterSection.trim() : current.reporterSection,
      locationDetail: input.locationDetail ? input.locationDetail.trim() : current.locationDetail,
      correctiveAction: input.correctiveAction !== undefined ? input.correctiveAction.trim() : current.correctiveAction,
      updatedAt: now,
    };

    this.findings[index] = updated;
    return { ...updated };
  }

  public async updateStatus(id: string, status: FindingStatus): Promise<FindingRecord> {
    return this.updateFinding(id, { status });
  }

  public async archiveFinding(id: string): Promise<boolean> {
    const index = this.findings.findIndex((f) => f.id === id);
    if (index === -1) {
      throw new Error(`Finding dengan ID "${id}" tidak ditemukan.`);
    }

    this.findings[index].isArchived = true;
    this.findings[index].updatedAt = new Date().toISOString();
    return true;
  }
}

export const mockFindingService = new MockFindingService();
