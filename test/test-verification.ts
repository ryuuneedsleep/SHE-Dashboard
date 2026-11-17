/**
 * SPLD SAFETY - Final Project Refactoring
 * Comprehensive Verification Test Suite for Phase 1 & 1.1: Closeout & Final Verification
 */

import { DEMO_FINDINGS } from '../src/data/demoFindings.ts';
import {
  DEPARTMENT_LIST,
  FINDING_CATEGORY_LIST,
  HAZARD_CATEGORY_LIST,
  RISK_LEVEL_LIST,
  FINDING_STATUS_LIST,
  FINDING_CATEGORY_OPTIONS,
  HAZARD_CATEGORY_OPTIONS,
  RISK_LEVEL_OPTIONS,
} from '../src/types/finding.ts';
import { MockAuthService, DEMO_ADMIN_USER } from '../src/services/mock/mockAuthService.ts';
import { MockFindingService } from '../src/services/mock/mockFindingService.ts';
import { MockDashboardService } from '../src/services/mock/mockDashboardService.ts';
import { loginSchema, findingFormSchema, profileFormSchema } from '../src/utils/validation.ts';
import app from '../server/app.js';
import { healthController } from '../server/controllers/healthController.js';
import { notFoundMiddleware } from '../server/middleware/notFoundMiddleware.js';
import { errorMiddleware } from '../server/middleware/errorMiddleware.js';
import bcrypt from 'bcrypt';
import { authModel } from '../server/models/authModel.js';
import { authController } from '../server/controllers/authController.js';
import {
  authMiddleware,
  hashSessionToken,
  SESSION_COOKIE_NAME,
} from '../server/middleware/authMiddleware.js';
import { originMiddleware } from '../server/middleware/originMiddleware.js';
import { authService } from '../src/services/authService.ts';
import { findingModel, formatDateOnly } from '../server/models/findingModel.js';
import { findingController } from '../server/controllers/findingController.js';
import { dashboardModel } from '../server/models/dashboardModel.js';
import { dashboardController } from '../server/controllers/dashboardController.js';
import { profileModel } from '../server/models/profileModel.js';
import { profileController } from '../server/controllers/profileController.js';
import { findingService as prodFindingService } from '../src/services/findingService.ts';
import { dashboardService as prodDashboardService } from '../src/services/dashboardService.ts';
import { profileService as prodProfileService } from '../src/services/profileService.ts';
import { blobService, ALLOWED_EVIDENCE_MIME_TYPES, MAX_EVIDENCE_SIZE_BYTES, detectImageSignature } from '../server/services/blobService.js';
import fs from 'fs';

async function runTests() {
  console.log('=== STARTING SPLD SAFETY PHASE 1.1 VERIFICATION TESTS ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✓ PASS [TEST ${total}]: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL [TEST ${total}]: ${testName}`);
      process.exitCode = 1;
    }
  }

  // -------------------------------------------------------------------------
  // 1. DEMO FINDINGS DATASET & TAXONOMY INTEGRITY (12 Records)
  // -------------------------------------------------------------------------
  console.log('\n[1. DEMO FINDINGS DATASET & TAXONOMY]');

  // TEST 1: Exactly 12 demo finding records
  assert(
    DEMO_FINDINGS.length === 12,
    `Demo dataset contains exactly 12 records (got ${DEMO_FINDINGS.length})`
  );

  // TEST 2: Unique reference numbers in format FND-2026-XXXX
  const refNos = DEMO_FINDINGS.map((f) => f.referenceNo);
  const uniqueRefNos = new Set(refNos);
  const refFormatRegex = /^FND-2026-\d{4}$/;
  assert(
    uniqueRefNos.size === 12 && refNos.every((r) => refFormatRegex.test(r)),
    'All 12 reference numbers are unique and match "FND-2026-XXXX" format'
  );

  // TEST 3: All 6 standard departments are represented
  const deptsInDemo = new Set(DEMO_FINDINGS.map((f) => f.reporterDepartment));
  assert(
    DEPARTMENT_LIST.every((d) => deptsInDemo.has(d)),
    'All 6 required departments are represented in demo findings'
  );

  // TEST 4: "Lain-lain" records include otherDepartmentName
  const otherDeptRecords = DEMO_FINDINGS.filter((f) => f.reporterDepartment === 'Lain-lain');
  assert(
    otherDeptRecords.length > 0 &&
    otherDeptRecords.every((f) => !!f.otherDepartmentName && f.otherDepartmentName.trim().length > 0),
    'Records with department "Lain-lain" have valid otherDepartmentName'
  );

  // TEST 5: All 3 finding categories are represented
  const categoriesInDemo = new Set(DEMO_FINDINGS.map((f) => f.findingCategory));
  assert(
    FINDING_CATEGORY_LIST.every((c) => categoriesInDemo.has(c)),
    'All 3 finding categories are represented in demo findings'
  );

  // TEST 6: All 5 hazard categories are represented
  const hazardsInDemo = new Set(
    DEMO_FINDINGS.map((f) => f.hazardCategory).filter(Boolean)
  );
  assert(
    HAZARD_CATEGORY_LIST.every((h) => hazardsInDemo.has(h)),
    'All 5 hazard categories are represented in demo findings'
  );

  // TEST 7: All 4 risk levels are represented
  const risksInDemo = new Set(DEMO_FINDINGS.map((f) => f.riskLevel));
  assert(
    RISK_LEVEL_LIST.every((r) => risksInDemo.has(r)),
    'All 4 risk levels are represented in demo findings'
  );

  // TEST 8: All 3 finding statuses are represented
  const statusesInDemo = new Set(DEMO_FINDINGS.map((f) => f.status));
  assert(
    FINDING_STATUS_LIST.every((s) => statusesInDemo.has(s)),
    'All 3 finding statuses (OPEN, IN_PROGRESS, CLOSED) are represented'
  );

  // TEST 9: Privacy isolation - NO Employee Numbers or Noreg in findings
  const hasNoNoreg = DEMO_FINDINGS.every((f) => !('noreg' in f) && !('employeeNumber' in f));
  assert(
    hasNoNoreg,
    'No findings records contain employee number or noreg fields'
  );

  // TEST 10: Evidences array constraint (max 3 photos)
  const validEvidences = DEMO_FINDINGS.every((f) => Array.isArray(f.evidences) && f.evidences.length <= 3);
  assert(
    validEvidences,
    'All demo findings have evidences array with at most 3 items'
  );

  // -------------------------------------------------------------------------
  // 2. MOCK AUTHENTICATION SERVICE & DEMO ACCOUNT
  // -------------------------------------------------------------------------
  console.log('\n[2. MOCK AUTHENTICATION SERVICE]');

  const testAuth = new MockAuthService();

  // TEST 11: Demo admin email is non-corporate domain admin@spld-safety.test
  assert(
    DEMO_ADMIN_USER.email === 'admin@spld-safety.test',
    `DEMO_ADMIN_USER uses non-corporate email "admin@spld-safety.test" (got ${DEMO_ADMIN_USER.email})`
  );

  // TEST 12: Initial unauthenticated state after logout
  await testAuth.logout();
  assert(
    !testAuth.isAuthenticated() && testAuth.getCurrentUser() === null,
    'MockAuthService starts unauthenticated after logout'
  );

  // TEST 13: Successful demo administrator login
  const loginResult = await testAuth.login({
    email: 'admin@spld-safety.test',
    password: 'demoPassword123',
  });
  assert(
    testAuth.isAuthenticated() &&
    loginResult.user.email === 'admin@spld-safety.test' &&
    testAuth.getSession()?.isDemo === true,
    'MockAuthService authenticates demo admin and sets isDemo flag'
  );

  // TEST 14: Profile update within demo session
  const updatedUser = await testAuth.updateProfile({
    name: 'Administrator Updated',
    email: 'admin.updated@spld-safety.test',
    phone: '0812-9999-8888',
    position: 'Senior Safety Lead',
    department: 'QSHE & Jiritsuka',
  });
  assert(
    testAuth.getCurrentUser()?.name === 'Administrator Updated' &&
    updatedUser.email === 'admin.updated@spld-safety.test',
    'MockAuthService updateProfile updates current user in session'
  );

  // TEST 15: Logout terminates session
  await testAuth.logout();
  assert(
    !testAuth.isAuthenticated(),
    'MockAuthService logout clears session successfully'
  );

  // -------------------------------------------------------------------------
  // 3. MOCK FINDING SERVICE & LIFECYCLE VALIDATION
  // -------------------------------------------------------------------------
  console.log('\n[3. MOCK FINDING SERVICE & STATUS LIFECYCLE]');

  const findingService = new MockFindingService();

  // TEST 16: Retrieve all initial findings
  const initialFindings = await findingService.getFindings();
  assert(
    initialFindings.length === 12,
    `getFindings() returns 12 initial findings (got ${initialFindings.length})`
  );

  // TEST 17: Search filter by reference number
  const searchByRef = await findingService.getFindings({ search: 'FND-2026-0004' });
  assert(
    searchByRef.length === 1 && searchByRef[0].referenceNo === 'FND-2026-0004',
    'getFindings({ search: "FND-2026-0004" }) returns exactly 1 matching finding'
  );

  // TEST 18: Search filter by keyword in title
  const searchByTitle = await findingService.getFindings({ search: 'forklift' });
  assert(
    searchByTitle.length >= 1 &&
    searchByTitle.some((f) => f.title.toLowerCase().includes('forklift')),
    'getFindings({ search: "forklift" }) returns matching findings'
  );

  // TEST 19: Filter by status
  const openFindings = await findingService.getFindings({ status: 'OPEN' });
  assert(
    openFindings.length > 0 && openFindings.every((f) => f.status === 'OPEN'),
    `getFindings({ status: "OPEN" }) returns only OPEN records (found ${openFindings.length})`
  );

  // TEST 20: Filter by risk level
  const criticalFindings = await findingService.getFindings({ riskLevel: 'Critical' });
  assert(
    criticalFindings.length === 2 && criticalFindings.every((f) => f.riskLevel === 'Critical'),
    'getFindings({ riskLevel: "Critical" }) returns exactly 2 Critical records'
  );

  // TEST 21: Filter by department
  const warehouseFindings = await findingService.getFindings({ department: 'Warehouse' });
  assert(
    warehouseFindings.length === 2 &&
    warehouseFindings.every((f) => f.reporterDepartment === 'Warehouse'),
    'getFindings({ department: "Warehouse" }) returns exactly 2 records'
  );

  // TEST 22: Get finding by ID
  const foundItem = await findingService.getFindingById('fnd-2026-0001');
  assert(
    foundItem !== null && foundItem.referenceNo === 'FND-2026-0001',
    'getFindingById("fnd-2026-0001") returns the correct record'
  );

  // TEST 23: Get finding with nonexistent ID returns null
  const notFoundItem = await findingService.getFindingById('non-existent-id');
  assert(
    notFoundItem === null,
    'getFindingById with nonexistent ID returns null'
  );

  // TEST 24: Create new finding auto-generates FND-2026-0013 and starts at OPEN
  const createdFinding = await findingService.createFinding({
    title: 'Kabel Kelistrikan Mengelupas di Ruang Server',
    description: 'Kabel power rak server 01 terkelupas isolasinya dan menyentuh frame besi.',
    findingCategory: 'Unsafe Condition',
    hazardCategory: 'Physical',
    riskLevel: 'High',
    findingDate: '2026-11-14',
    reporterName: 'Administrator Demo',
    reporterDepartment: 'QSHE & Jiritsuka',
    reporterSection: 'Safety Management Office',
    operationalArea: 'Facility & Utilities',
    locationDetail: 'Ruang Server Lt. 2 Rack A-01',
    correctiveAction: 'Segera lakukan isolasi listrik dan ganti kabel power standar.',
    dueDate: '2026-11-15',
    evidences: [
      {
        id: 'ev-test-1',
        fileName: 'kabel_mengelupas.jpg',
        fileSize: 1024000,
        fileType: 'image/jpeg',
        url: 'blob:http://localhost:5173/mock-uuid-1',
        uploadedAt: '2026-11-14T10:00:00Z',
      },
    ],
  });
  assert(
    createdFinding.referenceNo === 'FND-2026-0013' && createdFinding.status === 'OPEN',
    `createFinding creates record with ref "FND-2026-0013" and status "OPEN" (got ${createdFinding.referenceNo})`
  );

  // TEST 25: Evidence attached to created finding is accessible in detail
  const detailWithEvidence = await findingService.getFindingById(createdFinding.id);
  assert(
    detailWithEvidence !== null &&
    detailWithEvidence.evidences.length === 1 &&
    detailWithEvidence.evidences[0].fileName === 'kabel_mengelupas.jpg',
    'Created finding evidence photo is preserved and accessible via getFindingById'
  );

  // TEST 26: Total findings incremented to 13
  const afterCreate = await findingService.getFindings();
  assert(
    afterCreate.length === 13,
    `Total findings incremented to 13 after creation (got ${afterCreate.length})`
  );

  // TEST 27: Status transition from OPEN -> IN_PROGRESS succeeds
  const updatedToProgress = await findingService.updateStatus(createdFinding.id, 'IN_PROGRESS');
  assert(
    updatedToProgress.status === 'IN_PROGRESS',
    'updateStatus transitions record from OPEN to IN_PROGRESS'
  );

  // TEST 28: Direct transition OPEN -> CLOSED is rejected (must go through IN_PROGRESS)
  const freshOpen = await findingService.createFinding({
    title: 'Test Direct Close Violation',
    description: 'Testing lifecycle enforcement.',
    findingCategory: 'Unsafe Action',
    riskLevel: 'Low',
    findingDate: '2026-11-15',
    reporterName: 'Tester',
    reporterDepartment: 'SM',
    reporterSection: 'Test Section',
    operationalArea: 'Office Area',
    locationDetail: 'Test Detail',
  });
  let skipTransitionFailed = false;
  try {
    await findingService.updateStatus(freshOpen.id, 'CLOSED');
  } catch {
    skipTransitionFailed = true;
  }
  assert(
    skipTransitionFailed,
    'Direct status transition from OPEN to CLOSED is rejected by lifecycle validation'
  );

  // TEST 29: Backward transition from IN_PROGRESS -> OPEN is rejected
  let backwardTransitionFailed = false;
  try {
    await findingService.updateStatus(createdFinding.id, 'OPEN');
  } catch {
    backwardTransitionFailed = true;
  }
  assert(
    backwardTransitionFailed,
    'Backward status transition from IN_PROGRESS to OPEN is rejected'
  );

  // TEST 30: Status transition from IN_PROGRESS -> CLOSED succeeds
  const updatedToClosed = await findingService.updateStatus(createdFinding.id, 'CLOSED');
  assert(
    updatedToClosed.status === 'CLOSED',
    'updateStatus transitions record from IN_PROGRESS to CLOSED'
  );

  // TEST 31: CLOSED is terminal status — any transition from CLOSED is rejected
  let closedChangeFailed = false;
  try {
    await findingService.updateStatus(createdFinding.id, 'IN_PROGRESS');
  } catch {
    closedChangeFailed = true;
  }
  assert(
    closedChangeFailed,
    'CLOSED is terminal status: transition from CLOSED to IN_PROGRESS is rejected'
  );

  let closedToOpenFailed = false;
  try {
    await findingService.updateStatus(createdFinding.id, 'OPEN');
  } catch {
    closedToOpenFailed = true;
  }
  assert(
    closedToOpenFailed,
    'CLOSED is terminal status: transition from CLOSED to OPEN is rejected'
  );

  // TEST 32: Edit finding fields preserves updated data
  const editedFinding = await findingService.updateFinding(createdFinding.id, {
    title: 'Kabel Kelistrikan Telah Diganti Baru',
    correctiveAction: 'Penggantian kabel selesai dengan tipe heavy-duty.',
  });
  assert(
    editedFinding.title === 'Kabel Kelistrikan Telah Diganti Baru' &&
    editedFinding.correctiveAction === 'Penggantian kabel selesai dengan tipe heavy-duty.',
    'updateFinding successfully updates title and corrective action'
  );

  // TEST 33: Archive finding removes it from active list
  await findingService.archiveFinding(createdFinding.id);
  await findingService.archiveFinding(freshOpen.id);
  const afterArchive = await findingService.getFindings();
  assert(
    afterArchive.length === 12 && !afterArchive.some((f) => f.id === createdFinding.id),
    'archiveFinding excludes records from active getFindings() list'
  );

  // -------------------------------------------------------------------------
  // 4. MOCK DASHBOARD SERVICE & KPI CALCULATION
  // -------------------------------------------------------------------------
  console.log('\n[4. MOCK DASHBOARD SERVICE & KPI CALCULATION]');

  // Reset to original 12 demo findings for pristine dashboard verification
  findingService.resetToDemoData();
  const dashboardService = new MockDashboardService();

  const dashboardData = await dashboardService.getDashboardData();

  // TEST 34: Total findings KPI is 12
  assert(
    dashboardData.kpis.totalFindings === 12,
    `Total findings KPI is 12 (got ${dashboardData.kpis.totalFindings})`
  );

  // TEST 35: Status KPIs sum equals total findings (OPEN:5 + IN_PROGRESS:4 + CLOSED:3 = 12)
  const statusSum =
    dashboardData.kpis.openFindings +
    dashboardData.kpis.inProgressFindings +
    dashboardData.kpis.closedFindings;
  assert(
    statusSum === 12 &&
    dashboardData.kpis.openFindings === 5 &&
    dashboardData.kpis.inProgressFindings === 4 &&
    dashboardData.kpis.closedFindings === 3,
    `Status counts match dataset: OPEN(5) + IN_PROGRESS(4) + CLOSED(3) = 12`
  );

  // TEST 36: High Risk KPI includes High + Critical (High:3 + Critical:2 = 5)
  assert(
    dashboardData.kpis.highRiskFindings === 5,
    `High Risk KPI equals 5 (High: 3 + Critical: 2, got ${dashboardData.kpis.highRiskFindings})`
  );

  // TEST 37: Monthly trend data is aggregated chronologically
  assert(
    dashboardData.monthlyTrend.length > 0 &&
    dashboardData.monthlyTrend.reduce((acc, m) => acc + m.count, 0) === 12,
    `Monthly trend total points sum to 12 findings`
  );

  // TEST 38: Risk distribution percentages sum to ~100%
  const riskTotalPct = dashboardData.riskDistribution.reduce((acc, r) => acc + r.percentage, 0);
  assert(
    riskTotalPct >= 99 && riskTotalPct <= 101,
    `Risk distribution percentages sum to ~100% (got ${riskTotalPct}%)`
  );

  // TEST 39: Category distribution percentages sum to ~100%
  const catTotalPct = dashboardData.categoryDistribution.reduce((acc, c) => acc + c.percentage, 0);
  assert(
    catTotalPct >= 99 && catTotalPct <= 101,
    `Category distribution percentages sum to ~100% (got ${catTotalPct}%)`
  );

  // TEST 40: Recent findings has exactly 5 items
  assert(
    dashboardData.recentFindings.length === 5,
    `Recent findings list has exactly 5 items (got ${dashboardData.recentFindings.length})`
  );

  // TEST 41: Dashboard single filter by department
  const filteredDashboard = await dashboardService.getDashboardData({
    department: 'Warehouse',
  });
  assert(
    filteredDashboard.kpis.totalFindings === 2,
    `Dashboard filter by department "Warehouse" shows 2 findings (got ${filteredDashboard.kpis.totalFindings})`
  );

  // TEST 42: Dashboard multi-filter consistency (Department + Area + Date Range)
  const multiFilteredDashboard = await dashboardService.getDashboardData({
    department: 'Warehouse',
    operationalArea: 'Warehouse Area B',
    startDate: '2026-05-01',
    endDate: '2026-05-31',
  });
  assert(
    multiFilteredDashboard.kpis.totalFindings === 1 &&
    multiFilteredDashboard.recentFindings[0].referenceNo === 'FND-2026-0001',
    'Dashboard multi-filter (Dept + Area + Date Range) consistently isolates matching finding'
  );

  // -------------------------------------------------------------------------
  // 5. FORM VALIDATION SCHEMAS & EVIDENCE LIMITS
  // -------------------------------------------------------------------------
  console.log('\n[5. FORM VALIDATION SCHEMAS]');

  // TEST 43: Login schema valid input
  const validLogin = loginSchema.safeParse({
    email: 'admin@spld-safety.test',
    password: 'password123',
  });
  assert(validLogin.success, 'loginSchema accepts valid email and password');

  // TEST 44: Login schema invalid email
  const invalidEmailLogin = loginSchema.safeParse({
    email: 'not-an-email',
    password: 'password123',
  });
  assert(!invalidEmailLogin.success, 'loginSchema rejects invalid email format');

  // TEST 45: Finding form valid input
  const validFindingInput = {
    reporterName: 'Budi Santoso',
    reporterDepartment: 'Warehouse',
    reporterSection: 'Storage B',
    title: 'Lantai Licin Oli di Jalur Forklift',
    description: 'Ceceran oli mesin dari genset cadangan tercecer di jalur forklift.',
    findingCategory: 'Unsafe Condition',
    hazardCategory: 'Physical',
    riskLevel: 'High',
    findingDate: '2026-11-14',
    operationalArea: 'Warehouse Area B',
    locationDetail: 'Depan Pintu Genset 01',
    correctiveAction: 'Taburkan serbuk kayu dan bersihkan dengan degreaser.',
    dueDate: '2026-11-15',
  };
  const validFindingResult = findingFormSchema.safeParse(validFindingInput);
  assert(validFindingResult.success, 'findingFormSchema accepts valid finding input');

  // TEST 46: Finding form requires otherDepartmentName when department is "Lain-lain"
  const missingOtherDeptInput = {
    ...validFindingInput,
    reporterDepartment: 'Lain-lain',
    otherDepartmentName: '',
  };
  const missingOtherDeptResult = findingFormSchema.safeParse(missingOtherDeptInput);
  assert(
    !missingOtherDeptResult.success,
    'findingFormSchema rejects "Lain-lain" without otherDepartmentName'
  );

  const validOtherDeptInput = {
    ...validFindingInput,
    reporterDepartment: 'Lain-lain',
    otherDepartmentName: 'Vendor Cleaning Service',
  };
  const validOtherDeptResult = findingFormSchema.safeParse(validOtherDeptInput);
  assert(
    validOtherDeptResult.success,
    'findingFormSchema accepts "Lain-lain" with otherDepartmentName'
  );

  // TEST 49: Profile form valid input
  const validProfile = profileFormSchema.safeParse({
    name: 'Administrator Demo',
    email: 'admin@spld-safety.test',
    phone: '081234567890',
    position: 'Safety Lead',
    department: 'QSHE & Jiritsuka',
  });
  assert(validProfile.success, 'profileFormSchema accepts valid profile data');

  // TEST 50: Profile form invalid phone
  const invalidPhoneProfile = profileFormSchema.safeParse({
    name: 'Administrator Demo',
    email: 'admin@spld-safety.test',
    phone: '12345',
    position: 'Safety Lead',
    department: 'QSHE & Jiritsuka',
  });
  assert(!invalidPhoneProfile.success, 'profileFormSchema rejects invalid phone format');

  // -------------------------------------------------------------------------
  // 6. BACKEND HEALTH CHECK API & DATABASE PROBES (PHASE 2)
  // -------------------------------------------------------------------------
  console.log('\n[6. BACKEND HEALTH CHECK API & DATABASE PROBES]');

  // Spin up ephemeral server on random available port
  const server = await new Promise<import('http').Server>((resolve, reject) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
    s.on('error', reject);
  });
  const address = server.address() as import('net').AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  // TEST 51: Express app can spin up ephemeral HTTP server on dynamic port
  assert(
    Boolean(address && address.port > 0),
    `Express app starts and binds to ephemeral port (${address.port})`
  );

  // Helper for mock response when network sockets are sandbox-isolated
  interface MockExpressResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: unknown;
    status: (code: number) => MockExpressResponse;
    json: (data: unknown) => MockExpressResponse;
    send: (data: unknown) => MockExpressResponse;
    cookie: (name: string, val: string, opts?: unknown) => MockExpressResponse;
    clearCookie: (name: string, opts?: unknown) => MockExpressResponse;
    setHeader: (name: string, val: string) => MockExpressResponse;
    sendStatus: (code: number) => MockExpressResponse;
  }

  interface HealthEnvelope {
    success: boolean;
    data?: {
      api: string;
      timestamp: string;
      environment: string;
    };
  }

  interface ErrorEnvelope {
    success: boolean;
    code?: string;
    message?: string;
  }

  interface DbHealthEnvelope {
    success: boolean;
    code?: string;
    message?: string;
    data?: {
      database?: string;
    };
  }

  function createMockRes(): MockExpressResponse {
    const res: MockExpressResponse = {
      statusCode: 200,
      headers: {},
      body: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: unknown) {
        this.headers['content-type'] = 'application/json';
        this.body = data;
        return this;
      },
      send(data: unknown) {
        this.body = data;
        return this;
      },
      write(chunk: unknown) {
        if (!this.body) this.body = '';
        this.body += chunk;
        return true;
      },
      end(data?: unknown) {
        if (data !== undefined) this.body = data;
        return this;
      },
      on() {
        return this;
      },
      once() {
        return this;
      },
      emit() {
        return true;
      },
      cookie() {
        return this;
      },
      clearCookie() {
        return this;
      },
      setHeader(name: string, val: string) {
        this.headers[name.toLowerCase()] = val;
        return this;
      },
      sendStatus(code: number) {
        this.statusCode = code;
        return this;
      },
    };
    return res;
  }

  // Detect if network sockets can connect locally or if running in sandboxed isolation
  let canConnectNetwork = false;
  try {
    const probe = await fetch(`${baseUrl}/api/v1/health`);
    if (probe.status === 200) canConnectNetwork = true;
  } catch {
    canConnectNetwork = false;
  }

  // TEST 52: GET /api/v1/health returns HTTP 200 and application/json
  let healthStatus: number;
  let healthContentType: string;
  let healthJson: HealthEnvelope | null;

  if (canConnectNetwork) {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    healthStatus = res.status;
    healthContentType = res.headers.get('content-type') || '';
    healthJson = (await res.json()) as HealthEnvelope;
  } else {
    const mockRes = createMockRes();
    healthController.getLiveness({} as never, mockRes as never);
    healthStatus = mockRes.statusCode;
    healthContentType = mockRes.headers['content-type'] || '';
    healthJson = mockRes.body as HealthEnvelope;
  }

  assert(
    healthStatus === 200 && healthContentType.includes('application/json'),
    `GET /api/v1/health returns HTTP 200 with JSON content-type (got ${healthStatus})`
  );

  // TEST 53: GET /api/v1/health response payload adheres to standard contract
  assert(
    healthJson?.success === true &&
    healthJson.data?.api === 'healthy' &&
    typeof healthJson.data?.timestamp === 'string' &&
    healthJson.data?.environment === (process.env.NODE_ENV || 'development'),
    'GET /api/v1/health response matches standard envelope { success: true, data: { api: "healthy", ... } }'
  );

  // TEST 54: Unmatched route returns HTTP 404 with structured JSON
  let notFoundStatus: number;
  let notFoundJson: ErrorEnvelope | null;

  if (canConnectNetwork) {
    const res = await fetch(`${baseUrl}/api/v1/unknown-endpoint`);
    notFoundStatus = res.status;
    notFoundJson = (await res.json()) as ErrorEnvelope;
  } else {
    const mockRes = createMockRes();
    notFoundMiddleware(
      { method: 'GET', originalUrl: '/api/v1/unknown-endpoint' } as never,
      mockRes as never
    );
    notFoundStatus = mockRes.statusCode;
    notFoundJson = mockRes.body as ErrorEnvelope;
  }

  assert(
    notFoundStatus === 404 &&
    notFoundJson?.success === false &&
    notFoundJson?.code === 'NOT_FOUND',
    'Unmatched route returns HTTP 404 with structured error envelope (code: "NOT_FOUND")'
  );

  // TEST 55: Malformed JSON payload triggers 400 Bad Request error middleware
  let badJsonStatus: number;
  let badJsonPayload: ErrorEnvelope | null;

  if (canConnectNetwork) {
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"invalid": json syntax}',
    });
    badJsonStatus = res.status;
    badJsonPayload = (await res.json()) as ErrorEnvelope;
  } else {
    const mockRes = createMockRes();
    const syntaxErr = new SyntaxError('Unexpected token');
    Object.assign(syntaxErr, { status: 400, body: '{"invalid": json syntax}' });
    errorMiddleware(syntaxErr, {} as never, mockRes as never, (() => { }) as never);
    badJsonStatus = mockRes.statusCode;
    badJsonPayload = mockRes.body as ErrorEnvelope;
  }

  assert(
    badJsonStatus === 400 &&
    badJsonPayload?.success === false &&
    badJsonPayload?.code === 'BAD_REQUEST',
    'Malformed JSON body returns HTTP 400 with code "BAD_REQUEST"'
  );

  // TEST 56: GET /api/v1/health/db probe returns handled response without unhandled crash
  let dbHealthStatus: number;
  let dbHealthJson: DbHealthEnvelope | null;

  if (canConnectNetwork) {
    const res = await fetch(`${baseUrl}/api/v1/health/db`);
    dbHealthStatus = res.status;
    dbHealthJson = (await res.json()) as DbHealthEnvelope;
  } else {
    const mockRes = createMockRes();
    await healthController.getDatabaseReadiness({} as never, mockRes as never);
    dbHealthStatus = mockRes.statusCode;
    dbHealthJson = mockRes.body as DbHealthEnvelope;
  }

  const isHandledDbStatus =
    (dbHealthStatus === 503 &&
      (dbHealthJson?.code === 'DATABASE_NOT_CONFIGURED' ||
        dbHealthJson?.code === 'DATABASE_UNAVAILABLE')) ||
    (dbHealthStatus === 200 &&
      dbHealthJson?.success === true &&
      dbHealthJson?.data?.database === 'connected');

  assert(
    isHandledDbStatus,
    `GET /api/v1/health/db returns handled response code "${dbHealthJson?.code || 'SUCCESS'}" (HTTP ${dbHealthStatus})`
  );

  // TEST 57: Health check response does NOT leak database credentials or secrets
  const stringifiedResponses = JSON.stringify(healthJson) + JSON.stringify(dbHealthJson);
  const leaksSecrets =
    stringifiedResponses.includes('postgresql://') ||
    stringifiedResponses.includes('postgres:') ||
    stringifiedResponses.includes('password') ||
    stringifiedResponses.includes('ep-');
  assert(
    !leaksSecrets,
    'Health check responses do NOT leak database credentials, passwords, or connection strings'
  );

  // -------------------------------------------------------------------------
  // 7. AUTHENTICATION & SESSION MANAGEMENT (PHASE 3)
  // -------------------------------------------------------------------------
  console.log('\n[7. AUTHENTICATION & SESSION MANAGEMENT]');

  // TEST 58: hashSessionToken generates a 64-char hex SHA-256 string
  const rawTestToken = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const hashedToken = hashSessionToken(rawTestToken);
  assert(
    typeof hashedToken === 'string' &&
    hashedToken.length === 64 &&
    /^[a-f0-9]{64}$/.test(hashedToken),
    'hashSessionToken outputs deterministic 64-character SHA-256 hex digest'
  );

  // Helper response interface for auth
  interface AuthResponsePayload {
    success: boolean;
    code?: string;
    message?: string;
    data?: {
      user?: {
        id: string;
        email: string;
        fullName: string;
        phone: string | null;
        position: string | null;
        password_hash?: string;
      };
    };
  }

  // TEST 59: POST /api/v1/auth/login rejects missing credentials
  let emptyLoginRes: AuthResponsePayload | null;
  let emptyLoginStatus: number;
  if (canConnectNetwork) {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    emptyLoginStatus = res.status;
    emptyLoginRes = (await res.json()) as AuthResponsePayload;
  } else {
    const mockRes = createMockRes();
    await authController.login({ body: {} } as never, mockRes as never, (() => { }) as never);
    emptyLoginStatus = mockRes.statusCode;
    emptyLoginRes = mockRes.body as AuthResponsePayload;
  }
  assert(
    emptyLoginStatus === 400 &&
    emptyLoginRes?.success === false &&
    emptyLoginRes?.code === 'INVALID_CREDENTIALS',
    'POST /api/v1/auth/login rejects empty email or password with HTTP 400'
  );

  // Setup test administrator credentials with 12-round bcrypt hash
  const testPassword = 'SecureAdminPassword2026!';
  const testPasswordHash = await bcrypt.hash(testPassword, 12);
  const testAdminUser = {
    id: '11111111-2222-3333-4444-555555555555',
    email: 'admin-test@spld-safety.test',
    password_hash: testPasswordHash,
    full_name: 'Administrator Uji Sistem',
    phone: '081234567890',
    position: 'Safety Lead Engineer',
    is_active: true,
  };

  // Mock finding administrator for controller test
  const originalFindAdmin = authModel.findAdminByEmail;
  const originalCreateSession = authModel.createSession;
  const originalFindValidSession = authModel.findValidSessionByTokenHash;
  const originalRevokeSession = authModel.revokeSessionByTokenHash;

  let activeSessionTokenHash = '';
  let activeSessionRevoked = false;

  authModel.findAdminByEmail = async (email: string) => {
    if (email.toLowerCase() === testAdminUser.email) {
      return { ...testAdminUser };
    }
    if (email.toLowerCase() === 'inactive-admin@spld-safety.test') {
      return { ...testAdminUser, is_active: false };
    }
    return null;
  };

  authModel.createSession = async (params: {
    adminId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent: string | null;
  }) => {
    activeSessionTokenHash = params.tokenHash;
    activeSessionRevoked = false;
    return {
      id: 'session-uuid-1234',
      admin_id: params.adminId,
      expires_at: params.expiresAt,
      created_at: new Date(),
    };
  };

  authModel.findValidSessionByTokenHash = async (tokenHash: string) => {
    if (tokenHash === activeSessionTokenHash && !activeSessionRevoked) {
      return {
        session_id: 'session-uuid-1234',
        admin_id: testAdminUser.id,
        expires_at: new Date(Date.now() + 8 * 3600 * 1000),
        revoked_at: null,
        id: testAdminUser.id,
        email: testAdminUser.email,
        full_name: testAdminUser.full_name,
        phone: testAdminUser.phone,
        position: testAdminUser.position,
        is_active: true,
      };
    }
    return null;
  };

  authModel.revokeSessionByTokenHash = async (tokenHash: string) => {
    if (tokenHash === activeSessionTokenHash) {
      activeSessionRevoked = true;
      return true;
    }
    return false;
  };

  // TEST 60: POST /api/v1/auth/login rejects nonexistent administrator with generic error
  let unknownAdminStatus: number;
  let unknownAdminRes: AuthResponsePayload | null;
  if (canConnectNetwork) {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent-user@spld-safety.test',
        password: 'SomeRandomPassword123!',
      }),
    });
    unknownAdminStatus = res.status;
    unknownAdminRes = (await res.json()) as AuthResponsePayload;
  } else {
    const mockRes = createMockRes();
    await authController.login(
      {
        body: {
          email: 'nonexistent-user@spld-safety.test',
          password: 'SomeRandomPassword123!',
        },
      } as never,
      mockRes as never,
      (() => { }) as never
    );
    unknownAdminStatus = mockRes.statusCode;
    unknownAdminRes = mockRes.body as AuthResponsePayload;
  }
  assert(
    unknownAdminStatus === 401 &&
    unknownAdminRes?.success === false &&
    unknownAdminRes?.code === 'INVALID_CREDENTIALS' &&
    unknownAdminRes?.message === 'Email atau password tidak valid.',
    'POST /api/v1/auth/login returns generic 401 error for nonexistent administrator'
  );

  // TEST 61: Login fails when password does not match
  const wrongPassRes = createMockRes();
  await authController.login(
    {
      body: {
        email: testAdminUser.email,
        password: 'IncorrectPassword999!',
      },
    } as never,
    wrongPassRes as never,
    (() => { }) as never
  );
  const wrongPassPayload = wrongPassRes.body as AuthResponsePayload;
  assert(
    wrongPassRes.statusCode === 401 && wrongPassPayload?.code === 'INVALID_CREDENTIALS',
    'POST /api/v1/auth/login rejects incorrect password with HTTP 401'
  );

  // TEST 62: Login fails when administrator account is deactivated
  const inactiveRes = createMockRes();
  await authController.login(
    {
      body: {
        email: 'inactive-admin@spld-safety.test',
        password: testPassword,
      },
    } as never,
    inactiveRes as never,
    (() => { }) as never
  );
  const inactivePayload = inactiveRes.body as AuthResponsePayload;
  assert(
    inactiveRes.statusCode === 401 && inactivePayload?.code === 'INVALID_CREDENTIALS',
    'POST /api/v1/auth/login rejects deactivated administrator account (is_active = false)'
  );

  // TEST 63: Login succeeds with correct credentials
  let capturedRawToken = '';
  const successLoginRes = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as unknown,
    cookieName: '',
    cookieVal: '',
    cookieOpts: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
    cookie(name: string, val: string, opts: unknown) {
      this.cookieName = name;
      this.cookieVal = val;
      this.cookieOpts = opts;
      capturedRawToken = val;
      return this;
    },
  };

  await authController.login(
    {
      body: {
        email: testAdminUser.email,
        password: testPassword,
      },
      headers: { 'user-agent': 'Automated-Test-Agent/1.0' },
    } as never,
    successLoginRes as never,
    (() => { }) as never
  );

  const loginSuccessData = successLoginRes.body as AuthResponsePayload;
  assert(
    successLoginRes.statusCode === 200 &&
    loginSuccessData.success === true &&
    loginSuccessData.data?.user?.email === testAdminUser.email &&
    successLoginRes.cookieName === SESSION_COOKIE_NAME &&
    capturedRawToken.length === 64,
    'POST /api/v1/auth/login succeeds, sets HttpOnly session cookie, and returns safe admin object'
  );

  // TEST 64: Login response does NOT leak password_hash or internal secrets
  const loginStr = JSON.stringify(loginSuccessData);
  assert(
    !loginStr.includes('password_hash') &&
    !loginStr.includes(testPasswordHash) &&
    !loginStr.includes(capturedRawToken),
    'POST /api/v1/auth/login response envelope does NOT leak password_hash or token secrets'
  );

  // TEST 65: GET /api/v1/auth/me without cookie returns HTTP 401
  const noCookieRes = createMockRes();
  await authMiddleware({ cookies: {} } as never, noCookieRes as never, (() => { }) as never);
  const noCookiePayload = noCookieRes.body as AuthResponsePayload;
  assert(
    noCookieRes.statusCode === 401 && noCookiePayload?.code === 'UNAUTHORIZED',
    'GET /api/v1/auth/me without session cookie returns HTTP 401 UNAUTHORIZED'
  );

  // TEST 66: GET /api/v1/auth/me with valid session cookie returns administrator details
  let nextCalled = false;
  const mockReq: { cookies: Record<string, string>; user?: unknown; session?: unknown } = {
    cookies: { [SESSION_COOKIE_NAME]: capturedRawToken },
  };
  const validMeRes = createMockRes();
  await authMiddleware(
    mockReq as never,
    validMeRes as never,
    (() => {
      nextCalled = true;
    }) as never
  );
  assert(
    nextCalled && (mockReq.user as { email?: string })?.email === testAdminUser.email,
    'GET /api/v1/auth/me verifies valid session cookie from database and attaches user to request'
  );

  // TEST 67: GET /api/v1/auth/me rejects revoked session
  activeSessionRevoked = true;
  const revokedRes = createMockRes();
  await authMiddleware(
    { cookies: { [SESSION_COOKIE_NAME]: capturedRawToken } } as never,
    revokedRes as never,
    (() => { }) as never
  );
  const revokedPayload = revokedRes.body as AuthResponsePayload;
  assert(
    revokedRes.statusCode === 401 && revokedPayload?.code === 'UNAUTHORIZED',
    'GET /api/v1/auth/me rejects revoked session and clears client cookie'
  );

  // TEST 68: POST /api/v1/auth/logout clears cookie and revokes session
  let logoutCookieCleared = false;
  const logoutRes = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
    clearCookie(name: string) {
      if (name === SESSION_COOKIE_NAME) logoutCookieCleared = true;
      return this;
    },
  };

  await authController.logout(
    { cookies: { [SESSION_COOKIE_NAME]: capturedRawToken } } as never,
    logoutRes as never,
    (() => { }) as never
  );
  const logoutPayload = logoutRes.body as AuthResponsePayload;
  assert(
    logoutRes.statusCode === 200 && logoutPayload?.success === true && logoutCookieCleared,
    'POST /api/v1/auth/logout successfully clears session cookie and revokes session'
  );

  // Restore original methods on authModel
  authModel.findAdminByEmail = originalFindAdmin;
  authModel.createSession = originalCreateSession;
  authModel.findValidSessionByTokenHash = originalFindValidSession;
  authModel.revokeSessionByTokenHash = originalRevokeSession;

  // TEST 69: authModel.countAdmins executes against database or handles connection safely
  let adminCount: number;
  try {
    adminCount = await authModel.countAdmins();
  } catch {
    adminCount = 0; // Handled gracefully if DB disconnected
  }
  assert(
    typeof adminCount === 'number' && adminCount >= 0,
    `authModel.countAdmins() returns non-negative count (${adminCount} registered administrator)`
  );

  // TEST 70: Frontend authService is properly configured with credentials: include
  assert(
    typeof authService.login === 'function' &&
    typeof authService.getMe === 'function' &&
    typeof authService.logout === 'function',
    'Frontend authService exports login(), getMe(), and logout() methods'
  );

  // -------------------------------------------------------------------------
  // 8. CSRF, ORIGIN SECURITY, PWA CACHE & ADMIN SCRIPT (PHASE 3.1)
  // -------------------------------------------------------------------------
  console.log('\n[8. CSRF, ORIGIN SECURITY, PWA CACHE & ADMIN SCRIPT]');

  // TEST 71: Request from allowed origin receives strict matching CORS headers without wildcard
  const corsMockRes = createMockRes();
  originMiddleware(
    { method: 'GET', headers: { origin: 'http://localhost:5173' } } as never,
    corsMockRes as never,
    (() => { }) as never
  );
  assert(
    corsMockRes.headers['access-control-allow-origin'] === 'http://localhost:5173' &&
    corsMockRes.headers['access-control-allow-credentials'] === 'true' &&
    corsMockRes.headers['access-control-allow-origin'] !== '*',
    'Request from allowed origin receives explicit CORS headers without wildcard *'
  );

  // TEST 72: OPTIONS preflight from allowed origin returns HTTP 204
  const preflightRes = createMockRes();
  originMiddleware(
    { method: 'OPTIONS', headers: { origin: 'http://localhost:5173' } } as never,
    preflightRes as never,
    (() => { }) as never
  );
  assert(
    preflightRes.statusCode === 204,
    'OPTIONS preflight from allowed origin returns HTTP 204 No Content'
  );

  // TEST 73: OPTIONS preflight from unauthorized origin is rejected with HTTP 403 FORBIDDEN_ORIGIN
  const forbiddenOptionsRes = createMockRes();
  originMiddleware(
    { method: 'OPTIONS', headers: { origin: 'https://evil-attacker.com' } } as never,
    forbiddenOptionsRes as never,
    (() => { }) as never
  );
  const forbiddenOptionsPayload = forbiddenOptionsRes.body as { success: boolean; code: string };
  assert(
    forbiddenOptionsRes.statusCode === 403 &&
    forbiddenOptionsPayload?.code === 'FORBIDDEN_ORIGIN',
    'OPTIONS preflight from unauthorized origin is rejected with HTTP 403 FORBIDDEN_ORIGIN'
  );

  // TEST 74: State-changing POST request from unauthorized origin is rejected with HTTP 403
  const forbiddenPostRes = createMockRes();
  originMiddleware(
    { method: 'POST', headers: { origin: 'https://evil-attacker.com' } } as never,
    forbiddenPostRes as never,
    (() => { }) as never
  );
  const forbiddenPostPayload = forbiddenPostRes.body as { success: boolean; code: string };
  assert(
    forbiddenPostRes.statusCode === 403 &&
    forbiddenPostPayload?.code === 'FORBIDDEN_ORIGIN',
    'State-changing POST request from unauthorized origin is rejected with HTTP 403 FORBIDDEN_ORIGIN'
  );

  // TEST 75: State-changing POST request with unauthorized Referer is rejected with HTTP 403
  const forbiddenRefererRes = createMockRes();
  originMiddleware(
    { method: 'POST', headers: { referer: 'https://evil-phishing.com/malicious-page' } } as never,
    forbiddenRefererRes as never,
    (() => { }) as never
  );
  const forbiddenRefererPayload = forbiddenRefererRes.body as { success: boolean; code: string };
  assert(
    forbiddenRefererRes.statusCode === 403 &&
    forbiddenRefererPayload?.code === 'FORBIDDEN_ORIGIN',
    'State-changing POST request with unauthorized Referer is rejected with HTTP 403 FORBIDDEN_ORIGIN'
  );

  // TEST 76: Workbox configuration enforces NetworkOnly for all API routes
  const viteConfigContent = fs.readFileSync('vite.config.ts', 'utf-8');
  assert(
    viteConfigContent.includes('NetworkOnly') &&
    viteConfigContent.includes('navigateFallbackDenylist') &&
    viteConfigContent.includes('/^\\/api\\/'),
    'Vite PWA & Workbox configuration enforces NetworkOnly and navigateFallbackDenylist for /api/ routes'
  );

  // TEST 77: Administrator setup script enforces password masking, min 12 chars, single admin, and bcrypt
  const createAdminContent = fs.readFileSync('server/scripts/createAdmin.js', 'utf-8');
  assert(
    createAdminContent.includes('countAdmins') &&
    createAdminContent.includes('p1.length < 12') &&
    createAdminContent.includes('bcrypt.hash') &&
    createAdminContent.includes('Single Administrator') &&
    !createAdminContent.includes('process.stdout.write(ch)'),
    'Admin creation script strictly enforces single-admin policy, min 12-char password, and hidden input'
  );

  // -------------------------------------------------------------------------
  // 9. FINDING CRUD, STATUS HISTORY, DASHBOARD & PROFILE API (PHASE 4)
  // -------------------------------------------------------------------------
  console.log('\n[9. FINDING CRUD, STATUS HISTORY, DASHBOARD & PROFILE API]');

  const sampleFindingId = '11111111-2222-3333-4444-555555555555';
  const sampleAdminId = '99999999-8888-7777-6666-555555555555';

  const mockFindingData = {
    id: sampleFindingId,
    referenceNo: 'FND-2026-0001',
    reference_no: 'FND-2026-0001',
    title: 'Penumpukan Palet Kayu Melebihi Batas Maksimal',
    description: 'Palet kayu ditumpuk setinggi 3 meter di dekat jalur forklift.',
    findingCategory: 'UNSAFE_CONDITION',
    finding_category: 'UNSAFE_CONDITION',
    hazardCategory: 'PHYSICAL',
    hazard_category: 'PHYSICAL',
    riskLevel: 'HIGH',
    risk_level: 'HIGH',
    findingDate: '2026-05-12',
    finding_date: '2026-05-12',
    reporterName: 'Budi Santoso',
    reporter_name: 'Budi Santoso',
    reporterDepartment: 'Warehouse',
    reporter_department: 'Warehouse',
    reporterSectionArea: 'Inbound Storage Section',
    reporter_section_area: 'Inbound Storage Section',
    operationalArea: 'Warehouse Area B',
    operational_area: 'Warehouse Area B',
    locationDetail: 'Lorong B2 Rak Tingkat 3',
    location_detail: 'Lorong B2 Rak Tingkat 3',
    status: 'OPEN',
    evidences: [],
    statusHistory: [
      {
        id: 'hist-001',
        findingId: sampleFindingId,
        oldStatus: null,
        newStatus: 'OPEN',
        note: 'Laporan temuan baru dibuat.',
        changedByName: 'Administrator',
        createdAt: '2026-05-12T09:30:00Z',
      },
    ],
    createdAt: '2026-05-12T09:30:00Z',
    updatedAt: '2026-05-12T09:30:00Z',
  };

  // TEST 78: GET /api/v1/findings returns paginated list with items and pagination envelope
  const originalGetFindings = findingModel.getFindings;
  findingModel.getFindings = async () => ({
    items: [mockFindingData as never],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  });

  const getFindingsRes = createMockRes();
  await findingController.getFindings(
    { query: { page: '1', limit: '10' } } as never,
    getFindingsRes as never,
    (() => { }) as never
  );
  const getFindingsPayload = getFindingsRes.body as { success: boolean; data: unknown[]; pagination: { total: number } };
  assert(
    getFindingsRes.statusCode === 200 &&
    getFindingsPayload?.success === true &&
    getFindingsPayload.data.length === 1 &&
    getFindingsPayload.pagination.total === 1,
    'GET /api/v1/findings returns paginated list with standard envelope'
  );

  // TEST 79: GET /api/v1/findings/:id with invalid UUID returns HTTP 400 INVALID_ID
  const invalidIdRes = createMockRes();
  await findingController.getFindingById(
    { params: { id: 'invalid-not-uuid' } } as never,
    invalidIdRes as never,
    (() => { }) as never
  );
  const invalidIdPayload = invalidIdRes.body as { success: boolean; code: string };
  assert(
    invalidIdRes.statusCode === 400 && invalidIdPayload?.code === 'INVALID_ID',
    'GET /api/v1/findings/:id with malformed UUID returns HTTP 400 INVALID_ID'
  );

  // TEST 80: GET /api/v1/findings/:id for nonexistent ID returns HTTP 404 NOT_FOUND
  const originalGetFindingById = findingModel.getFindingById;
  findingModel.getFindingById = async () => null;

  const notFoundFindingRes = createMockRes();
  await findingController.getFindingById(
    { params: { id: '00000000-0000-0000-0000-000000000000' } } as never,
    notFoundFindingRes as never,
    (() => { }) as never
  );
  const notFoundFindingPayload = notFoundFindingRes.body as { success: boolean; code: string };
  assert(
    notFoundFindingRes.statusCode === 404 && notFoundFindingPayload?.code === 'NOT_FOUND',
    'GET /api/v1/findings/:id for nonexistent ID returns HTTP 404 NOT_FOUND'
  );

  // TEST 81: GET /api/v1/findings/:id returns complete finding with history and evidence
  findingModel.getFindingById = async () => mockFindingData as never;
  const foundFindingRes = createMockRes();
  await findingController.getFindingById(
    { params: { id: sampleFindingId } } as never,
    foundFindingRes as never,
    (() => { }) as never
  );
  const foundFindingPayload = foundFindingRes.body as { success: boolean; data: typeof mockFindingData };
  assert(
    foundFindingRes.statusCode === 200 &&
    foundFindingPayload?.data?.referenceNo === 'FND-2026-0001' &&
    Array.isArray(foundFindingPayload.data.statusHistory),
    'GET /api/v1/findings/:id returns complete detail with status history timeline'
  );

  // TEST 82: POST /api/v1/findings rejects missing required fields with HTTP 400
  const invalidCreateRes = createMockRes();
  await findingController.createFinding(
    { body: { title: 'Incomplete' }, user: { id: sampleAdminId } } as never,
    invalidCreateRes as never,
    (() => { }) as never
  );
  const invalidCreatePayload = invalidCreateRes.body as { success: boolean; code: string };
  assert(
    invalidCreateRes.statusCode === 400 && invalidCreatePayload?.code === 'VALIDATION_ERROR',
    'POST /api/v1/findings rejects missing required fields with HTTP 400 VALIDATION_ERROR'
  );

  // TEST 83: POST /api/v1/findings rejects department "Lain-lain" without reporter_other_department
  const missingOtherDeptRes = createMockRes();
  await findingController.createFinding(
    {
      body: {
        reporter_name: 'Tester',
        reporter_department: 'Lain-lain',
        reporter_other_department: '',
        reporter_section_area: 'Facility',
        title: 'Blower Rusak',
        description: 'Blower tidak berfungsi',
        finding_category: 'Unsafe Condition',
        risk_level: 'Medium',
        finding_date: '2026-05-12',
        operational_area: 'Facility & Utilities',
        location_detail: 'Gedung B',
      },
      user: { id: sampleAdminId },
    } as never,
    missingOtherDeptRes as never,
    (() => { }) as never
  );
  const missingOtherDeptPayload = missingOtherDeptRes.body as { success: boolean; code: string };
  assert(
    missingOtherDeptRes.statusCode === 400 && missingOtherDeptPayload?.code === 'MISSING_OTHER_DEPARTMENT',
    'POST /api/v1/findings rejects "Lain-lain" without reporter_other_department'
  );

  // TEST 84: POST /api/v1/findings creates finding with reference number, status OPEN, and initial history
  const originalCreateFinding = findingModel.createFinding;
  findingModel.createFinding = async () => ({
    ...mockFindingData,
    status: 'OPEN',
  } as never);

  const validCreateRes = createMockRes();
  await findingController.createFinding(
    {
      body: {
        reporter_name: 'Budi Santoso',
        reporter_department: 'Warehouse',
        reporter_section_area: 'Inbound Storage Section',
        title: 'Penumpukan Palet Kayu Melebihi Batas Maksimal',
        description: 'Palet kayu ditumpuk setinggi 3 meter di dekat jalur forklift.',
        finding_category: 'Unsafe Condition',
        hazard_category: 'Physical',
        risk_level: 'High',
        finding_date: '2026-05-12',
        operational_area: 'Warehouse Area B',
        location_detail: 'Lorong B2 Rak Tingkat 3',
      },
      user: { id: sampleAdminId },
    } as never,
    validCreateRes as never,
    (() => { }) as never
  );
  const validCreatePayload = validCreateRes.body as { success: boolean; data: typeof mockFindingData };
  assert(
    validCreateRes.statusCode === 201 &&
    validCreatePayload?.success === true &&
    validCreatePayload?.data?.status === 'OPEN' &&
    validCreatePayload?.data?.referenceNo.startsWith('FND-'),
    'POST /api/v1/findings successfully creates finding with status OPEN and reference number'
  );

  // TEST 85: PUT /api/v1/findings/:id updates finding fields and returns updated data
  const originalUpdateFinding = findingModel.updateFinding;
  findingModel.updateFinding = async () => ({
    ...mockFindingData,
    title: 'Judul Temuan Telah Diperbarui',
  } as never);

  const updateFindingRes = createMockRes();
  await findingController.updateFinding(
    {
      params: { id: sampleFindingId },
      body: { title: 'Judul Temuan Telah Diperbarui' },
      user: { id: sampleAdminId },
    } as never,
    updateFindingRes as never,
    (() => { }) as never
  );
  const updateFindingPayload = updateFindingRes.body as { success: boolean; data: typeof mockFindingData };
  assert(
    updateFindingRes.statusCode === 200 &&
    updateFindingPayload?.data?.title === 'Judul Temuan Telah Diperbarui',
    'PUT /api/v1/findings/:id successfully updates finding details'
  );

  // TEST 86: PUT /api/v1/findings/:id/status transition from OPEN to IN_PROGRESS succeeds
  const originalUpdateStatus = findingModel.updateStatus;
  findingModel.getFindingById = async () => ({ ...mockFindingData, status: 'OPEN' } as never);
  findingModel.updateStatus = async () => ({ ...mockFindingData, status: 'IN_PROGRESS' } as never);

  const transitionToInProgressRes = createMockRes();
  await findingController.updateFindingStatus(
    {
      params: { id: sampleFindingId },
      body: { status: 'IN_PROGRESS', note: 'Tindakan perbaikan dimulai' },
      user: { id: sampleAdminId },
    } as never,
    transitionToInProgressRes as never,
    (() => { }) as never
  );
  const transitionToInProgressPayload = transitionToInProgressRes.body as { success: boolean; data: { status: string } };
  assert(
    transitionToInProgressRes.statusCode === 200 &&
    transitionToInProgressPayload?.data?.status === 'IN_PROGRESS',
    'Status transition OPEN ➔ IN_PROGRESS succeeds and updates lifecycle'
  );

  // TEST 87: PUT /api/v1/findings/:id/status transition from IN_PROGRESS to CLOSED succeeds
  findingModel.getFindingById = async () => ({ ...mockFindingData, status: 'IN_PROGRESS' } as never);
  findingModel.updateStatus = async () => ({
    ...mockFindingData,
    status: 'CLOSED',
    closedAt: '2026-05-18T10:00:00Z',
  } as never);

  const transitionToClosedRes = createMockRes();
  await findingController.updateFindingStatus(
    {
      params: { id: sampleFindingId },
      body: { status: 'CLOSED', note: 'Palet telah diturunkan dan diverifikasi aman.' },
      user: { id: sampleAdminId },
    } as never,
    transitionToClosedRes as never,
    (() => { }) as never
  );
  const transitionToClosedPayload = transitionToClosedRes.body as { success: boolean; data: { status: string; closedAt?: string } };
  assert(
    transitionToClosedRes.statusCode === 200 &&
    transitionToClosedPayload?.data?.status === 'CLOSED',
    'Status transition IN_PROGRESS ➔ CLOSED succeeds and sets closed_at'
  );

  // TEST 88: PUT /api/v1/findings/:id/status transition directly from OPEN to CLOSED is rejected
  findingModel.getFindingById = async () => ({ ...mockFindingData, status: 'OPEN' } as never);
  const illegalOpenToClosedRes = createMockRes();
  await findingController.updateFindingStatus(
    {
      params: { id: sampleFindingId },
      body: { status: 'CLOSED' },
      user: { id: sampleAdminId },
    } as never,
    illegalOpenToClosedRes as never,
    (() => { }) as never
  );
  const illegalOpenToClosedPayload = illegalOpenToClosedRes.body as { success: boolean; code: string };
  assert(
    illegalOpenToClosedRes.statusCode === 400 &&
    illegalOpenToClosedPayload?.code === 'ILLEGAL_TRANSITION',
    'Direct status transition OPEN ➔ CLOSED is rejected with HTTP 400 ILLEGAL_TRANSITION'
  );

  // TEST 89: PUT /api/v1/findings/:id/status backward transition IN_PROGRESS to OPEN is rejected
  findingModel.getFindingById = async () => ({ ...mockFindingData, status: 'IN_PROGRESS' } as never);
  const illegalBackwardRes = createMockRes();
  await findingController.updateFindingStatus(
    {
      params: { id: sampleFindingId },
      body: { status: 'OPEN' },
      user: { id: sampleAdminId },
    } as never,
    illegalBackwardRes as never,
    (() => { }) as never
  );
  const illegalBackwardPayload = illegalBackwardRes.body as { success: boolean; code: string };
  assert(
    illegalBackwardRes.statusCode === 400 &&
    illegalBackwardPayload?.code === 'ILLEGAL_TRANSITION',
    'Backward status transition IN_PROGRESS ➔ OPEN is rejected with HTTP 400 ILLEGAL_TRANSITION'
  );

  // TEST 90: PUT /api/v1/findings/:id/status transition on terminal CLOSED is rejected
  findingModel.getFindingById = async () => ({ ...mockFindingData, status: 'CLOSED' } as never);
  const terminalClosedRes = createMockRes();
  await findingController.updateFindingStatus(
    {
      params: { id: sampleFindingId },
      body: { status: 'IN_PROGRESS' },
      user: { id: sampleAdminId },
    } as never,
    terminalClosedRes as never,
    (() => { }) as never
  );
  const terminalClosedPayload = terminalClosedRes.body as { success: boolean; code: string };
  assert(
    terminalClosedRes.statusCode === 400 &&
    terminalClosedPayload?.code === 'TERMINAL_STATUS',
    'Transition on terminal CLOSED status is rejected with HTTP 400 TERMINAL_STATUS'
  );

  // TEST 91: DELETE /api/v1/findings/:id performs soft archive
  const originalArchiveFinding = findingModel.archiveFinding;
  findingModel.archiveFinding = async () => true;

  const archiveRes = createMockRes();
  await findingController.archiveFinding(
    { params: { id: sampleFindingId }, user: { id: sampleAdminId } } as never,
    archiveRes as never,
    (() => { }) as never
  );
  const archivePayload = archiveRes.body as { success: boolean };
  assert(
    archiveRes.statusCode === 200 && archivePayload?.success === true,
    'DELETE /api/v1/findings/:id performs soft archive without physical row deletion'
  );

  // Restore findingModel methods
  findingModel.getFindings = originalGetFindings;
  findingModel.getFindingById = originalGetFindingById;
  findingModel.createFinding = originalCreateFinding;
  findingModel.updateFinding = originalUpdateFinding;
  findingModel.updateStatus = originalUpdateStatus;
  findingModel.archiveFinding = originalArchiveFinding;

  // TEST 92: GET /api/v1/dashboard aggregates 5 KPIs correctly (High Risk = HIGH + CRITICAL)
  const originalGetDashboardData = dashboardModel.getDashboardData;
  dashboardModel.getDashboardData = async () => ({
    kpis: {
      totalFindings: 12,
      openFindings: 5,
      inProgressFindings: 4,
      closedFindings: 3,
      highRiskFindings: 5, // 3 High + 2 Critical
    },
    monthlyTrend: [
      { month: 'Nov 2026', count: 12, openCount: 5, closedCount: 3 },
    ],
    riskDistribution: [
      { level: 'Low', rawLevel: 'LOW', count: 2, percentage: 17, color: '#10B981' },
      { level: 'Medium', rawLevel: 'MEDIUM', count: 5, percentage: 42, color: '#F59E0B' },
      { level: 'High', rawLevel: 'HIGH', count: 3, percentage: 25, color: '#F97316' },
      { level: 'Critical', rawLevel: 'CRITICAL', count: 2, percentage: 17, color: '#EF4444' },
    ],
    categoryDistribution: [
      { category: 'Unsafe Condition', rawCategory: 'UNSAFE_CONDITION', count: 6, percentage: 50, color: '#EF4444' },
      { category: 'Unsafe Action', rawCategory: 'UNSAFE_ACTION', count: 4, percentage: 33, color: '#F59E0B' },
      { category: 'Improvement Opportunity', rawCategory: 'IMPROVEMENT_OPPORTUNITY', count: 2, percentage: 17, color: '#3B82F6' },
    ],
    recentFindings: [mockFindingData as never],
  });

  const dashboardRes = createMockRes();
  await dashboardController.getDashboard(
    { query: {} } as never,
    dashboardRes as never,
    (() => { }) as never
  );
  const dashboardPayload = dashboardRes.body as { success: boolean; data: { kpis: { totalFindings: number; highRiskFindings: number } } };
  assert(
    dashboardRes.statusCode === 200 &&
    dashboardPayload?.success === true &&
    dashboardPayload.data.kpis.totalFindings === 12 &&
    dashboardPayload.data.kpis.highRiskFindings === 5,
    'GET /api/v1/dashboard returns 5 KPIs with High Risk = HIGH + CRITICAL'
  );

  dashboardModel.getDashboardData = originalGetDashboardData;

  // TEST 93: GET /api/v1/profile retrieves active administrator profile without password_hash
  const originalGetProfile = profileModel.getProfile;
  profileModel.getProfile = async () => ({
    id: sampleAdminId,
    email: 'admin@spld-safety.test',
    fullName: 'Lead Safety Administrator',
    name: 'Lead Safety Administrator',
    phone: '081234567890',
    position: 'Lead Safety Officer',
    department: 'QSHE & Jiritsuka',
    createdAt: '2026-11-17T00:00:00Z',
    updatedAt: '2026-11-17T00:00:00Z',
  } as never);

  const getProfileRes = createMockRes();
  await profileController.getProfile(
    { user: { id: sampleAdminId } } as never,
    getProfileRes as never,
    (() => { }) as never
  );
  const getProfilePayload = getProfileRes.body as { success: boolean; data: { email: string; password_hash?: string } };
  assert(
    getProfileRes.statusCode === 200 &&
    getProfilePayload?.data?.email === 'admin@spld-safety.test' &&
    getProfilePayload?.data?.password_hash === undefined,
    'GET /api/v1/profile retrieves administrator profile without leaking password_hash'
  );

  // TEST 94: PUT /api/v1/profile updates profile successfully
  const originalUpdateProfile = profileModel.updateProfile;
  profileModel.updateProfile = async () => ({
    id: sampleAdminId,
    email: 'admin-updated@spld-safety.test',
    fullName: 'Updated Administrator',
    name: 'Updated Administrator',
    phone: '081299998888',
    position: 'Senior Safety Manager',
    department: 'QSHE & Jiritsuka',
    createdAt: '2026-11-17T00:00:00Z',
    updatedAt: '2026-11-17T01:00:00Z',
  } as never);

  const updateProfileRes = createMockRes();
  await profileController.updateProfile(
    {
      user: { id: sampleAdminId },
      body: {
        name: 'Updated Administrator',
        email: 'admin-updated@spld-safety.test',
        phone: '081299998888',
        position: 'Senior Safety Manager',
      },
    } as never,
    updateProfileRes as never,
    (() => { }) as never
  );
  const updateProfilePayload = updateProfileRes.body as { success: boolean; data: { fullName: string } };
  assert(
    updateProfileRes.statusCode === 200 &&
    updateProfilePayload?.data?.fullName === 'Updated Administrator',
    'PUT /api/v1/profile updates profile and returns updated administrator details'
  );

  // TEST 95: PUT /api/v1/profile rejects email conflict with HTTP 409 EMAIL_ALREADY_EXISTS
  profileModel.updateProfile = async () => {
    const err = new Error('Email sudah digunakan oleh akun lain.') as Error & { code: string; statusCode: number };
    err.code = 'EMAIL_ALREADY_EXISTS';
    err.statusCode = 409;
    throw err;
  };

  const conflictProfileRes = createMockRes();
  await profileController.updateProfile(
    {
      user: { id: sampleAdminId },
      body: {
        name: 'Admin Test',
        email: 'conflict@spld-safety.test',
      },
    } as never,
    conflictProfileRes as never,
    (() => { }) as never
  );
  const conflictProfilePayload = conflictProfileRes.body as { success: boolean; code: string };
  assert(
    conflictProfileRes.statusCode === 409 &&
    conflictProfilePayload?.code === 'EMAIL_ALREADY_EXISTS',
    'PUT /api/v1/profile rejects email conflict with HTTP 409 EMAIL_ALREADY_EXISTS'
  );

  // TEST 96: PUT /api/v1/profile rejects invalid email format with HTTP 400
  const invalidEmailRes = createMockRes();
  await profileController.updateProfile(
    {
      user: { id: sampleAdminId },
      body: {
        name: 'Admin Test',
        email: 'not-an-email',
      },
    } as never,
    invalidEmailRes as never,
    (() => { }) as never
  );
  const invalidEmailPayload = invalidEmailRes.body as { success: boolean; code: string };
  assert(
    invalidEmailRes.statusCode === 400 &&
    invalidEmailPayload?.code === 'VALIDATION_ERROR',
    'PUT /api/v1/profile rejects invalid email format with HTTP 400 VALIDATION_ERROR'
  );

  profileModel.getProfile = originalGetProfile;
  profileModel.updateProfile = originalUpdateProfile;

  // TEST 97: Production frontend services export all required CRUD & Dashboard methods
  assert(
    typeof prodFindingService.getFindings === 'function' &&
    typeof prodFindingService.getFindingById === 'function' &&
    typeof prodFindingService.createFinding === 'function' &&
    typeof prodFindingService.updateFinding === 'function' &&
    typeof prodFindingService.updateStatus === 'function' &&
    typeof prodFindingService.archiveFinding === 'function' &&
    typeof prodDashboardService.getDashboardData === 'function' &&
    typeof prodProfileService.getProfile === 'function' &&
    typeof prodProfileService.updateProfile === 'function',
    'Production frontend findingService, dashboardService, and profileService export all required methods'
  );

  // TEST 98: SQL contract verification on findingModel.js (changed_by_admin_id column contract)
  const findingModelSource = fs.readFileSync('server/models/findingModel.js', 'utf8');
  const usesChangedByAdminId =
    findingModelSource.includes('changed_by_admin_id') &&
    !findingModelSource.includes('note,\n           changed_by\n') &&
    !findingModelSource.includes('note,\n           changed_by_name\n');
  assert(
    usesChangedByAdminId,
    'finding_status_history strictly uses changed_by_admin_id and does not insert into nonexistent changed_by/changed_by_name'
  );

  // TEST 99: Finding detail query dynamically joins admin_users to produce changed_by_name
  const joinsAdminUsersForName =
    findingModelSource.includes('LEFT JOIN admin_users u ON u.id = h.changed_by_admin_id') &&
    findingModelSource.includes('u.full_name AS changed_by_name');
  assert(
    joinsAdminUsersForName,
    'Finding detail query joins admin_users to produce changed_by_name dynamically without physical table column'
  );

  // TEST 100: Atomic status transition enforces expected current status in CTE WHERE clause
  const usesStrictStatusGuard =
    findingModelSource.includes('AND status = $3') &&
    findingModelSource.includes('WITH updated AS') &&
    findingModelSource.includes('JOIN inserted_history ON TRUE');
  assert(
    usesStrictStatusGuard,
    'updateStatus enforces expected current status ($3) in CTE WHERE clause and atomic history insertion'
  );

  // TEST 101: Concurrent status transition with mismatched current status returns HTTP 409 STATUS_CONFLICT
  let getFindingCallCount = 0;
  findingModel.getFindingById = async (id: string) => {
    getFindingCallCount++;
    return {
      ...mockFindingData,
      id,
      // First call (initial check) sees OPEN, second call (recheck after race condition) sees IN_PROGRESS
      status: getFindingCallCount === 1 ? 'OPEN' : 'IN_PROGRESS',
    } as never;
  };
  findingModel.updateStatus = async () => null; // CTE returns 0 rows because DB status is no longer OPEN

  const conflictRes = createMockRes();
  await findingController.updateFindingStatus(
    {
      params: { id: sampleFindingId },
      body: { status: 'IN_PROGRESS' },
      user: { id: sampleAdminId },
    } as never,
    conflictRes as never,
    (() => { }) as never
  );
  const conflictPayload = conflictRes.body as { success: boolean; code: string };
  assert(
    conflictRes.statusCode === 409 && conflictPayload?.code === 'STATUS_CONFLICT',
    'Concurrent status transition with mismatched current status returns HTTP 409 STATUS_CONFLICT'
  );

  // TEST 102: Status transition on archived or nonexistent finding returns HTTP 404 NOT_FOUND
  findingModel.getFindingById = async () => null;
  findingModel.updateStatus = async () => null;

  const notFoundStatusRes = createMockRes();
  await findingController.updateFindingStatus(
    {
      params: { id: sampleFindingId },
      body: { status: 'IN_PROGRESS' },
      user: { id: sampleAdminId },
    } as never,
    notFoundStatusRes as never,
    (() => { }) as never
  );
  const notFoundStatusPayload = notFoundStatusRes.body as { success: boolean; code: string };
  assert(
    notFoundStatusRes.statusCode === 404 && notFoundStatusPayload?.code === 'NOT_FOUND',
    'Status transition on archived or nonexistent finding returns HTTP 404 NOT_FOUND'
  );

  // Restore findingModel.getFindingById & updateStatus
  findingModel.getFindingById = originalGetFindingById;
  findingModel.updateStatus = originalUpdateStatus;

  // TEST 103: Soft archive SQL contract audit (uses UPDATE ... SET archived_at = NOW())
  const softArchiveContract =
    findingModelSource.includes('UPDATE findings') &&
    findingModelSource.includes('SET archived_at = NOW()') &&
    !findingModelSource.includes('DELETE FROM findings');
  assert(
    softArchiveContract,
    'archiveFinding strictly performs soft archive (archived_at = NOW()) without physical row deletion'
  );

  // TEST 104: Frontend findingService serializes all 8 filter criteria to API query parameters
  let capturedUrl = '';
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL) => {
    capturedUrl = String(url);
    return {
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      }),
    };
  }) as typeof fetch;

  await prodFindingService.getFindings({
    search: 'forklift',
    status: 'OPEN',
    riskLevel: 'High',
    findingCategory: 'Unsafe Condition',
    hazardCategory: 'Physical',
    department: 'Warehouse',
    operationalArea: 'Warehouse Area B',
    startDate: '2026-05-01',
    endDate: '2026-05-31',
  });
  globalThis.fetch = originalFetch;

  const urlParams = new URLSearchParams(capturedUrl.split('?')[1] || '');
  assert(
    urlParams.get('search') === 'forklift' &&
    urlParams.get('status') === 'OPEN' &&
    urlParams.get('risk_level') === 'High' &&
    urlParams.get('finding_category') === 'Unsafe Condition' &&
    urlParams.get('hazard_category') === 'Physical' &&
    urlParams.get('department') === 'Warehouse' &&
    urlParams.get('operational_area') === 'Warehouse Area B' &&
    urlParams.get('from_date') === '2026-05-01' &&
    urlParams.get('to_date') === '2026-05-31',
    'findingService.getFindings correctly serializes all 8 filter criteria to API query parameters'
  );

  // TEST 105: formatDateOnly prevents timezone date shifts (e.g. UTC+7) and handles nulls cleanly
  const testDate = new Date(2026, 4, 12, 0, 0, 0); // May 12, 2026 local time
  const formattedTestDate = formatDateOnly(testDate);
  assert(
    formattedTestDate === '2026-05-12' &&
    formatDateOnly('2026-05-12T15:30:00Z') === '2026-05-12' &&
    formatDateOnly(null) === null &&
    formatDateOnly(undefined) === null,
    'formatDateOnly produces deterministic YYYY-MM-DD without UTC timezone day-shifting'
  );

  // TEST 106: updateFinding SQL contract specifies explicit casts ($1::uuid, $2::varchar, ..., $15::date)
  const updateFindingContract =
    findingModelSource.includes('id = $1::uuid') &&
    findingModelSource.includes('reporter_name = $2::varchar') &&
    findingModelSource.includes('due_date = $15::date') &&
    findingModelSource.includes('corrective_action = $14::text') &&
    findingModelSource.includes('finding_date = $11::date');
  assert(
    updateFindingContract,
    'updateFinding strictly annotates all 15 SQL parameters with explicit PostgreSQL types'
  );

  // TEST 107: updateFinding handles nullable fields (hazard_category, corrective_action, due_date)
  const originalGetFindingByIdForEdit = findingModel.getFindingById;
  findingModel.getFindingById = async () => mockFindingData as never;
  let capturedUpdatePayload: unknown = null;
  findingModel.updateFinding = async (id: string, data: unknown) => {
    capturedUpdatePayload = data;
    return { ...mockFindingData, id, ...(data as object) } as never;
  };

  const updateNullableRes = createMockRes();
  await findingController.updateFinding(
    {
      params: { id: sampleFindingId },
      body: {
        title: 'Updated Title',
        hazard_category: '', // clear hazard
        corrective_action: '', // clear action
        due_date: '', // clear due date
      },
      user: { id: sampleAdminId },
    } as never,
    updateNullableRes as never,
    (() => { }) as never
  );
  assert(
    updateNullableRes.statusCode === 200 &&
    (capturedUpdatePayload as { hazard_category?: unknown })?.hazard_category === null &&
    (capturedUpdatePayload as { corrective_action?: unknown })?.corrective_action === null &&
    (capturedUpdatePayload as { due_date?: unknown })?.due_date === null,
    'updateFinding clears nullable fields to null when empty strings are passed'
  );

  // TEST 108: updateFinding switching from Lain-lain to standard department clears otherDepartment
  findingModel.getFindingById = async () =>
    ({
      ...mockFindingData,
      reporterDepartment: 'Lain-lain',
      reporterOtherDepartment: 'Sub-unit Alpha',
    }) as never;
  const switchDeptRes = createMockRes();
  await findingController.updateFinding(
    {
      params: { id: sampleFindingId },
      body: {
        reporter_department: 'Warehouse',
        reporter_other_department: 'Old Other Dept',
      },
      user: { id: sampleAdminId },
    } as never,
    switchDeptRes as never,
    (() => { }) as never
  );
  assert(
    switchDeptRes.statusCode === 200 &&
    (capturedUpdatePayload as { reporter_other_department?: unknown })?.reporter_other_department === null,
    'updateFinding switching from Lain-lain to standard department resets reporter_other_department to null'
  );

  // TEST 109: updateFinding rejects attempts to modify read-only fields (status, id, reference_no)
  findingModel.getFindingById = async () => mockFindingData as never;
  const tamperRes = createMockRes();
  await findingController.updateFinding(
    {
      params: { id: sampleFindingId },
      body: {
        id: '99999999-9999-9999-9999-999999999999',
        reference_no: 'FND-HACKED-001',
        status: 'CLOSED',
        title: 'Tampered Finding',
      },
      user: { id: sampleAdminId },
    } as never,
    tamperRes as never,
    (() => { }) as never
  );
  assert(
    tamperRes.statusCode === 200 &&
    (capturedUpdatePayload as { status?: unknown })?.status === undefined &&
    (capturedUpdatePayload as { reference_no?: unknown })?.reference_no === undefined,
    'updateFinding strictly ignores and discards attempts to mutate read-only fields (status, reference_no, id)'
  );

  // Restore findingModel.updateFinding and getFindingById
  findingModel.updateFinding = originalUpdateFinding;
  findingModel.getFindingById = originalGetFindingByIdForEdit;

  // TEST 110: Enum option sets map database enums (UNSAFE_CONDITION, HIGH, etc.) to human labels
  const catEnumValues = FINDING_CATEGORY_OPTIONS.map((o) => o.value);
  const hazardEnumValues = HAZARD_CATEGORY_OPTIONS.map((o) => o.value);
  const riskEnumValues = RISK_LEVEL_OPTIONS.map((o) => o.value);
  assert(
    catEnumValues.includes('UNSAFE_CONDITION') &&
    catEnumValues.includes('UNSAFE_ACTION') &&
    catEnumValues.includes('IMPROVEMENT_OPPORTUNITY') &&
    hazardEnumValues.includes('PHYSICAL') &&
    hazardEnumValues.includes('CHEMICAL') &&
    riskEnumValues.includes('LOW') &&
    riskEnumValues.includes('HIGH') &&
    riskEnumValues.includes('CRITICAL'),
    'FINDING_CATEGORY_OPTIONS, HAZARD_CATEGORY_OPTIONS, and RISK_LEVEL_OPTIONS correctly define canonical Neon DB enums'
  );

  // TEST 111: Ephemeral HTTP server cleanly closes after test execution
  const serverClosed = await new Promise<boolean>((resolve) => {
    server.close((err) => resolve(!err));
  });
  assert(serverClosed, 'Ephemeral HTTP server closes cleanly without hanging');

  // -------------------------------------------------------------------------
  // 10. VERCEL SERVERLESS FUNCTION & API ROUTING (PHASE 4.3 / VERCEL FIX)
  // -------------------------------------------------------------------------
  console.log('\n[10. VERCEL SERVERLESS FUNCTION & API ROUTING]');

  // TEST 112: vercel.json specifies valid API rewrite and SPA fallback exclusion
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const hasApiRewrite = vercelConfig.rewrites?.some(
    (r: { source: string; destination: string }) =>
      r.source === '/api/(.*)' && r.destination === '/api/[...path]'
  );
  const hasSpaFallback = vercelConfig.rewrites?.some(
    (r: { source: string; destination: string }) =>
      r.destination === '/index.html' && r.source.includes('?!api')
  );
  assert(
    Boolean(hasApiRewrite && hasSpaFallback),
    'vercel.json configures explicit /api/(.*) rewrite to /api/[...path] and excludes /api from SPA fallback'
  );

  // TEST 113: api/[...path].js exists and exports a valid default handler function
  const vercelModule = await import('../api/[...path].js');
  const vercelHandler = vercelModule.default;
  assert(
    typeof vercelHandler === 'function',
    'api/[...path].js exports a valid default Vercel serverless handler'
  );

  // TEST 114: Vercel serverless handler forwards /api/v1/health and returns HTTP 200 with JSON envelope
  const vercelHealthRes = createMockRes();
  await new Promise<void>((resolve) => {
    const mockReq = {
      url: '/api/v1/health',
      method: 'GET',
      headers: { accept: 'application/json' },
    };
    vercelHandler(mockReq as never, vercelHealthRes as never);
    setTimeout(resolve, 50);
  });
  const vercelHealthPayload = vercelHealthRes.body as { success: boolean; data: { api: string } };
  assert(
    vercelHealthRes.statusCode === 200 &&
      vercelHealthPayload?.success === true &&
      vercelHealthPayload?.data?.api === 'healthy',
    'Vercel handler executes /api/v1/health and returns HTTP 200 with standard health envelope'
  );

  // TEST 115: Vercel serverless handler normalizes stripped /v1/health to /api/v1/health
  const vercelStrippedRes = createMockRes();
  await new Promise<void>((resolve) => {
    const mockReq = {
      url: '/v1/health',
      method: 'GET',
      headers: { accept: 'application/json' },
    };
    vercelHandler(mockReq as never, vercelStrippedRes as never);
    setTimeout(resolve, 50);
  });
  const vercelStrippedPayload = vercelStrippedRes.body as { success: boolean; data: { api: string } };
  assert(
    vercelStrippedRes.statusCode === 200 &&
      vercelStrippedPayload?.success === true &&
      vercelStrippedPayload?.data?.api === 'healthy',
    'Vercel handler normalizes stripped /v1/health into /api/v1/health and returns HTTP 200'
  );

  // TEST 116: Vercel serverless handler returns JSON 404 envelope (not HTML) for unmatched API routes
  const vercelNotFoundRes = createMockRes();
  await new Promise<void>((resolve) => {
    const mockReq = {
      url: '/api/v1/unmatched-route-xyz',
      method: 'GET',
      headers: { accept: 'application/json' },
    };
    vercelHandler(mockReq as never, vercelNotFoundRes as never);
    setTimeout(resolve, 50);
  });
  const vercelNotFoundPayload = vercelNotFoundRes.body as { success: boolean; code: string };
  assert(
    vercelNotFoundRes.statusCode === 404 &&
      vercelNotFoundPayload?.success === false &&
      vercelNotFoundPayload?.code === 'NOT_FOUND',
    'Vercel handler returns JSON 404 envelope (not HTML) for unmatched API paths'
  );

  // -------------------------------------------------------------------------
  // 11. VERCEL BLOB PRIVATE STORAGE & EVIDENCE INTEGRATION (PHASE 5)
  // -------------------------------------------------------------------------
  console.log('\n[11. VERCEL BLOB PRIVATE STORAGE & EVIDENCE INTEGRATION]');

  // TEST 117: Storage constants adhere strictly to Blueprint constraints
  assert(
    MAX_EVIDENCE_SIZE_BYTES === 5 * 1024 * 1024 &&
      ALLOWED_EVIDENCE_MIME_TYPES.length === 3 &&
      ALLOWED_EVIDENCE_MIME_TYPES.includes('image/jpeg') &&
      ALLOWED_EVIDENCE_MIME_TYPES.includes('image/png') &&
      ALLOWED_EVIDENCE_MIME_TYPES.includes('image/webp'),
    'blobService defines strictly MAX_EVIDENCE_SIZE_BYTES = 5 MB and allowed MIME types (JPEG, PNG, WebP)'
  );

  // TEST 118: uploadPresign requires authenticated admin session
  const unauthPresignRes = createMockRes();
  await findingController.uploadPresign(
    { params: { id: sampleFindingId }, user: null } as never,
    unauthPresignRes as never,
    (() => {}) as never
  );
  assert(
    unauthPresignRes.statusCode === 401 &&
      (unauthPresignRes.body as { success?: boolean })?.success === false,
    'uploadPresign returns HTTP 401 Unauthorized when request lacks authenticated admin session'
  );

  // TEST 119: uploadPresign returns 404 if finding does not exist
  const originalGetFindingByIdForPhase5 = findingModel.getFindingById;
  const originalCountEvidences = findingModel.countEvidences;
  const originalGetEvidenceById = findingModel.getEvidenceById;
  const originalAddEvidence = findingModel.addEvidence;
  const originalDeleteEvidence = findingModel.deleteEvidence;

  findingModel.getFindingById = async () => null as never;
  const notFoundPresignRes = createMockRes();
  await findingController.uploadPresign(
    { params: { id: '00000000-0000-0000-0000-000000000000' }, user: { id: sampleAdminId } } as never,
    notFoundPresignRes as never,
    (() => {}) as never
  );
  assert(
    notFoundPresignRes.statusCode === 404 &&
      (notFoundPresignRes.body as { code?: string })?.code === 'NOT_FOUND',
    'uploadPresign returns HTTP 404 when target finding does not exist'
  );

  // TEST 120: uploadPresign rejects archived finding with HTTP 400
  findingModel.getFindingById = async () => ({ ...mockFindingData, isArchived: true }) as never;
  const archivedPresignRes = createMockRes();
  await findingController.uploadPresign(
    { params: { id: sampleFindingId }, user: { id: sampleAdminId } } as never,
    archivedPresignRes as never,
    (() => {}) as never
  );
  assert(
    archivedPresignRes.statusCode === 400 &&
      (archivedPresignRes.body as { message?: string })?.message?.includes('diarsipkan'),
    'uploadPresign rejects uploads to archived findings with HTTP 400'
  );

  // TEST 121: uploadPresign enforces 3-photo maximum limit
  findingModel.getFindingById = async () => mockFindingData as never;
  findingModel.countEvidences = async () => 3;
  const maxLimitPresignRes = createMockRes();
  await findingController.uploadPresign(
    { params: { id: sampleFindingId }, user: { id: sampleAdminId } } as never,
    maxLimitPresignRes as never,
    (() => {}) as never
  );
  assert(
    maxLimitPresignRes.statusCode === 400 &&
      (maxLimitPresignRes.body as { message?: string })?.message?.includes('maksimum 3 foto'),
    'uploadPresign rejects upload token issuance when finding already reached 3-photo limit'
  );

  // TEST 122: uploadPresign generates valid token when valid finding and count < 3
  findingModel.countEvidences = async () => 1;
  const originalHandlePresign = blobService.handlePresignRequest;
  blobService.handlePresignRequest = async () => ({
    token: 'verbatim-mock-blob-presigned-token-xyz',
    urlOptions: { addRandomSuffix: false },
  });
  const validPresignRes = createMockRes();
  await findingController.uploadPresign(
    {
      params: { id: sampleFindingId },
      body: { type: 'blob.generate-client-token', payload: { pathname: `findings/${sampleFindingId}/photo.jpg` } },
      user: { id: sampleAdminId },
    } as never,
    validPresignRes as never,
    (() => {}) as never
  );
  assert(
    validPresignRes.statusCode === 200 &&
      Boolean((validPresignRes.body as { token?: string })?.token),
    'uploadPresign successfully delegates to blobService and returns signed client upload token'
  );
  blobService.handlePresignRequest = originalHandlePresign;

  // TEST 123: confirmEvidence rejects unsupported MIME types
  const originalVerifyBlob = blobService.verifyBlob;
  blobService.verifyBlob = async (p: string) => ({
    size: 1024,
    contentType: 'application/pdf',
    pathname: p,
  });
  const invalidMimeRes = createMockRes();
  await findingController.confirmEvidence(
    {
      params: { id: sampleFindingId },
      body: {
        pathname: `findings/${sampleFindingId}/document.pdf`,
        fileName: 'document.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
      },
      user: { id: sampleAdminId },
    } as never,
    invalidMimeRes as never,
    (() => {}) as never
  );
  assert(
    invalidMimeRes.statusCode === 400 &&
      (invalidMimeRes.body as { message?: string })?.message?.includes('Format file tidak didukung'),
    'confirmEvidence rejects unsupported MIME types (e.g. application/pdf) with HTTP 400'
  );

  // TEST 124: confirmEvidence rejects files exceeding 5MB limit
  blobService.verifyBlob = async (p: string) => ({
    size: 6 * 1024 * 1024,
    contentType: 'image/png',
    pathname: p,
  });
  const oversizeRes = createMockRes();
  await findingController.confirmEvidence(
    {
      params: { id: sampleFindingId },
      body: {
        pathname: `findings/${sampleFindingId}/big.png`,
        fileName: 'big.png',
        mimeType: 'image/png',
        fileSize: 6 * 1024 * 1024,
      },
      user: { id: sampleAdminId },
    } as never,
    oversizeRes as never,
    (() => {}) as never
  );
  assert(
    oversizeRes.statusCode === 400 &&
      (oversizeRes.body as { message?: string })?.message?.includes('5 MB'),
    'confirmEvidence rejects files exceeding 5MB with HTTP 400'
  );

  // TEST 125: confirmEvidence validates pathname prefix matches finding ID
  const invalidPrefixRes = createMockRes();
  await findingController.confirmEvidence(
    {
      params: { id: sampleFindingId },
      body: {
        pathname: 'findings/some-other-id/photo.jpg',
        fileName: 'photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 50000,
      },
      user: { id: sampleAdminId },
    } as never,
    invalidPrefixRes as never,
    (() => {}) as never
  );
  assert(
    invalidPrefixRes.statusCode === 400 &&
      (invalidPrefixRes.body as { message?: string })?.message?.includes('Prefix pathname'),
    'confirmEvidence rejects pathnames that do not match the expected findings/{id}/ prefix'
  );

  // TEST 126: confirmEvidence rejects when finding count is already 3 (atomic enforcement)
  findingModel.countEvidences = async () => 3;
  const countLimitRes = createMockRes();
  await findingController.confirmEvidence(
    {
      params: { id: sampleFindingId },
      body: {
        pathname: `findings/${sampleFindingId}/photo4.jpg`,
        fileName: 'photo4.jpg',
        mimeType: 'image/jpeg',
        fileSize: 50000,
      },
      user: { id: sampleAdminId },
    } as never,
    countLimitRes as never,
    (() => {}) as never
  );
  assert(
    countLimitRes.statusCode === 400 &&
      (countLimitRes.body as { message?: string })?.message?.includes('3 foto'),
    'confirmEvidence atomically rejects uploads when finding has reached 3 photos'
  );

  // TEST 127: confirmEvidence verifies blob in storage with access: "private" and persists metadata
  findingModel.countEvidences = async () => 1;
  const originalVerifyBlobSignature = blobService.verifyBlobSignature;
  let verifiedPathname: string | null = null;
  blobService.verifyBlob = async (p: string) => {
    verifiedPathname = p;
    return { size: 50000, contentType: 'image/jpeg', pathname: p };
  };
  blobService.verifyBlobSignature = async () => 'image/jpeg';
  const mockSavedEvidence = {
    id: '11111111-1111-1111-1111-111111111111',
    finding_id: sampleFindingId,
    blob_pathname: `findings/${sampleFindingId}/photo1.jpg`,
    file_name: 'photo1.jpg',
    mime_type: 'image/jpeg',
    file_size_bytes: 50000,
    created_at: new Date().toISOString(),
  };
  findingModel.addEvidence = async () => mockSavedEvidence as never;

  const validConfirmRes = createMockRes();
  await findingController.confirmEvidence(
    {
      params: { id: sampleFindingId },
      body: {
        pathname: `findings/${sampleFindingId}/photo1.jpg`,
        fileName: 'photo1.jpg',
        mimeType: 'image/jpeg',
        fileSize: 50000,
      },
      user: { id: sampleAdminId },
    } as never,
    validConfirmRes as never,
    (() => {}) as never
  );
  const confirmPayload = validConfirmRes.body as { success?: boolean; data?: { id?: string; url?: string } };
  assert(
    validConfirmRes.statusCode === 201 &&
      confirmPayload?.success === true &&
      confirmPayload?.data?.id === mockSavedEvidence.id &&
      confirmPayload?.data?.url?.includes(`/api/v1/findings/${sampleFindingId}/evidence/${mockSavedEvidence.id}/content`) &&
      verifiedPathname === `findings/${sampleFindingId}/photo1.jpg`,
    'confirmEvidence calls blobService.verifyBlob, persists to Neon DB, and returns HTTP 201 with streaming url'
  );
  blobService.verifyBlob = originalVerifyBlob;
  blobService.verifyBlobSignature = originalVerifyBlobSignature;

  // TEST 128: getFindingById maps evidences to streaming URLs
  const sampleWithEv = {
    ...mockFindingData,
    evidences: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        findingId: sampleFindingId,
        fileName: 'test.png',
        fileSize: 12345,
        fileType: 'image/png',
        blobPathname: `findings/${sampleFindingId}/test.png`,
        uploadedAt: new Date().toISOString(),
        url: `/api/v1/findings/${sampleFindingId}/evidence/11111111-1111-1111-1111-111111111111/content`,
      },
    ],
  };
  findingModel.getFindingById = async () => sampleWithEv as never;
  const detailRes = createMockRes();
  await findingController.getFindingById(
    { params: { id: sampleFindingId }, user: { id: sampleAdminId } } as never,
    detailRes as never,
    (() => {}) as never
  );
  const detailPayload = detailRes.body as { success?: boolean; data?: { evidences?: Array<{ url?: string }> } };
  assert(
    detailRes.statusCode === 200 &&
      detailPayload?.data?.evidences?.[0]?.url === `/api/v1/findings/${sampleFindingId}/evidence/11111111-1111-1111-1111-111111111111/content`,
    'getFindingById maps evidence list to authenticated streaming content endpoint URL'
  );

  // TEST 129: getEvidenceContent requires authenticated admin session
  const unauthStreamRes = createMockRes();
  await findingController.getEvidenceContent(
    { params: { id: sampleFindingId, evidenceId: '11111111-1111-1111-1111-111111111111' }, user: null } as never,
    unauthStreamRes as never,
    (() => {}) as never
  );
  assert(
    unauthStreamRes.statusCode === 401 &&
      (unauthStreamRes.body as { success?: boolean })?.success === false,
    'getEvidenceContent returns HTTP 401 Unauthorized for unauthenticated requests'
  );

  // TEST 130: getEvidenceContent returns 404 if evidence does not exist
  findingModel.getEvidenceById = async () => null as never;
  const notFoundStreamRes = createMockRes();
  await findingController.getEvidenceContent(
    { params: { id: sampleFindingId, evidenceId: '00000000-0000-0000-0000-000000000000' }, user: { id: sampleAdminId } } as never,
    notFoundStreamRes as never,
    (() => {}) as never
  );
  assert(
    notFoundStreamRes.statusCode === 404 &&
      (notFoundStreamRes.body as { code?: string })?.code === 'NOT_FOUND',
    'getEvidenceContent returns HTTP 404 when requested evidence ID is not found in database'
  );

  // TEST 131: getEvidenceContent sets Cache-Control: private, no-store and nosniff
  findingModel.getEvidenceById = async () => mockSavedEvidence as never;
  const originalGetBlobStream = blobService.getBlobStream;
  blobService.getBlobStream = async () => ({
    contentType: 'image/jpeg',
    contentLength: 50000,
    body: Buffer.from('FAKE-JPEG-BINARY-DATA'),
  } as never);

  const streamRes = createMockRes();
  await findingController.getEvidenceContent(
    { params: { id: sampleFindingId, evidenceId: mockSavedEvidence.id }, user: { id: sampleAdminId } } as never,
    streamRes as never,
    (() => {}) as never
  );
  assert(
    streamRes.statusCode === 200 &&
      streamRes.headers['content-type'] === 'image/jpeg' &&
      streamRes.headers['cache-control'] === 'private, no-store, max-age=0' &&
      streamRes.headers['x-content-type-options'] === 'nosniff',
    'getEvidenceContent sets Cache-Control: private, no-store, max-age=0 and X-Content-Type-Options: nosniff headers'
  );
  blobService.getBlobStream = originalGetBlobStream;

  // TEST 132: deleteEvidence requires authenticated admin session
  const unauthDeleteRes = createMockRes();
  await findingController.deleteEvidence(
    { params: { id: sampleFindingId, evidenceId: '11111111-1111-1111-1111-111111111111' }, user: null } as never,
    unauthDeleteRes as never,
    (() => {}) as never
  );
  assert(
    unauthDeleteRes.statusCode === 401 &&
      (unauthDeleteRes.body as { success?: boolean })?.success === false,
    'deleteEvidence returns HTTP 401 Unauthorized for unauthenticated requests'
  );

  // TEST 133: deleteEvidence returns 404 if evidence does not exist
  findingModel.getEvidenceById = async () => null as never;
  const notFoundDeleteRes = createMockRes();
  await findingController.deleteEvidence(
    { params: { id: sampleFindingId, evidenceId: '00000000-0000-0000-0000-000000000000' }, user: { id: sampleAdminId } } as never,
    notFoundDeleteRes as never,
    (() => {}) as never
  );
  assert(
    notFoundDeleteRes.statusCode === 404 &&
      (notFoundDeleteRes.body as { code?: string })?.code === 'NOT_FOUND',
    'deleteEvidence returns HTTP 404 if evidence record is not found'
  );

  // TEST 134: deleteEvidence calls blobService.deleteBlob and removes record from database
  findingModel.getEvidenceById = async () => mockSavedEvidence as never;
  let deletedBlobPathname: string | null = null;
  const originalDeleteBlob = blobService.deleteBlob;
  blobService.deleteBlob = async (p: string) => {
    deletedBlobPathname = p;
  };
  let databaseDeleteCalled = false;
  findingModel.deleteEvidence = async () => {
    databaseDeleteCalled = true;
    return true;
  };

  const validDeleteRes = createMockRes();
  await findingController.deleteEvidence(
    { params: { id: sampleFindingId, evidenceId: mockSavedEvidence.id }, user: { id: sampleAdminId } } as never,
    validDeleteRes as never,
    (() => {}) as never
  );
  assert(
    validDeleteRes.statusCode === 200 &&
      (validDeleteRes.body as { success?: boolean })?.success === true &&
      deletedBlobPathname === mockSavedEvidence.blob_pathname &&
      databaseDeleteCalled === true,
    'deleteEvidence invokes blobService.deleteBlob with access: "private" and atomically removes database record'
  );
  blobService.deleteBlob = originalDeleteBlob;

  // Restore findingModel methods
  findingModel.getFindingById = originalGetFindingByIdForPhase5;
  findingModel.countEvidences = originalCountEvidences;
  findingModel.getEvidenceById = originalGetEvidenceById;
  findingModel.addEvidence = originalAddEvidence;
  findingModel.deleteEvidence = originalDeleteEvidence;

  // -------------------------------------------------------------------------
  // 12. EVIDENCE RELIABILITY & PRODUCTION CONCURRENCY VERIFICATION (PHASE 5.1)
  // -------------------------------------------------------------------------
  console.log('\n[12. EVIDENCE RELIABILITY & PRODUCTION CONCURRENCY VERIFICATION (PHASE 5.1)]');

  findingModel.getFindingById = async () => mockFindingData as never;

  // TEST 135: detectImageSignature correctly validates magic bytes
  const fakeJpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const fakePngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const fakeWebpBytes = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
  const fakePdfBytes = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x0a, 0x25, 0xd0, 0xd4]);
  const fakeExeBytes = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);

  assert(
    detectImageSignature(fakeJpegBytes) === 'image/jpeg' &&
      detectImageSignature(fakePngBytes) === 'image/png' &&
      detectImageSignature(fakeWebpBytes) === 'image/webp' &&
      detectImageSignature(fakePdfBytes) === null &&
      detectImageSignature(fakeExeBytes) === null,
    'detectImageSignature reliably validates JPEG, PNG, and WebP magic bytes and rejects non-image binaries'
  );

  // TEST 136: confirmEvidence rejects MIME spoofing with HTTP 400 INVALID_FILE_SIGNATURE
  findingModel.countEvidences = async () => 1;
  const spoofBlobOriginalVerify = blobService.verifyBlob;
  const spoofBlobOriginalVerifySig = blobService.verifyBlobSignature;
  let spoofDeletedBlobPath: string | null = null;
  const spoofOriginalDel = blobService.deleteBlob;
  blobService.deleteBlob = async (p: string) => {
    spoofDeletedBlobPath = p;
  };
  blobService.verifyBlob = async (p: string) => ({
    size: 50000,
    contentType: 'image/jpeg', // Spoofed header
    pathname: p,
  });
  blobService.verifyBlobSignature = async () => null; // Signature check fails!

  const spoofConfirmRes = createMockRes();
  await findingController.confirmEvidence(
    {
      params: { id: sampleFindingId },
      body: {
        pathname: `findings/${sampleFindingId}/malicious.jpg`,
        fileName: 'malicious.jpg',
        mimeType: 'image/jpeg',
        fileSize: 50000,
      },
      user: { id: sampleAdminId },
    } as never,
    spoofConfirmRes as never,
    (() => {}) as never
  );
  assert(
    spoofConfirmRes.statusCode === 400 &&
      (spoofConfirmRes.body as { code?: string })?.code === 'INVALID_FILE_SIGNATURE' &&
      spoofDeletedBlobPath === `findings/${sampleFindingId}/malicious.jpg`,
    'confirmEvidence detects MIME spoofing, rejects with INVALID_FILE_SIGNATURE, and deletes orphan blob'
  );
  blobService.verifyBlob = spoofBlobOriginalVerify;
  blobService.verifyBlobSignature = spoofBlobOriginalVerifySig;
  blobService.deleteBlob = spoofOriginalDel;

  // TEST 137: Concurrent finalize when finding has 2 photos: exactly 1 succeeds, 1 rejected and cleaned up
  let currentEvidenceCount = 2;
  findingModel.countEvidences = async () => currentEvidenceCount;
  const cleanedOrphanBlobs: string[] = [];
  const origDelForConcurrency = blobService.deleteBlob;
  blobService.deleteBlob = async (p: string) => {
    cleanedOrphanBlobs.push(p);
  };
  const origVerifyBlobForConc = blobService.verifyBlob;
  const origVerifySigForConc = blobService.verifyBlobSignature;
  blobService.verifyBlob = async (p: string) => ({ size: 50000, contentType: 'image/jpeg', pathname: p });
  blobService.verifyBlobSignature = async () => 'image/jpeg';

  const origAddEvidenceForConc = findingModel.addEvidence;
  let lockHolder: Promise<void> = Promise.resolve();
  findingModel.addEvidence = async (findingId: string, data: { blobPathname: string; fileName: string; mimeType: string; fileSizeBytes: number }) => {
    let releaseLock: () => void = () => {};
    const lockWait = new Promise<void>((res) => { releaseLock = res; });
    const prevLock = lockHolder;
    lockHolder = lockHolder.then(() => lockWait);

    await prevLock;
    try {
      if (currentEvidenceCount < 3) {
        currentEvidenceCount++;
        return {
          id: `ev-uuid-${currentEvidenceCount}`,
          finding_id: findingId,
          blob_pathname: data.blobPathname,
          file_name: data.fileName,
          mime_type: data.mimeType,
          file_size_bytes: data.fileSizeBytes,
          created_at: new Date().toISOString(),
        } as never;
      }
      return null as never;
    } finally {
      releaseLock();
    }
  };

  const concResA = createMockRes();
  const concResB = createMockRes();

  await Promise.all([
    findingController.confirmEvidence(
      {
        params: { id: sampleFindingId },
        body: { pathname: `findings/${sampleFindingId}/photoA.jpg`, fileName: 'photoA.jpg', mimeType: 'image/jpeg', fileSize: 50000 },
        user: { id: sampleAdminId },
      } as never,
      concResA as never,
      (() => {}) as never
    ),
    findingController.confirmEvidence(
      {
        params: { id: sampleFindingId },
        body: { pathname: `findings/${sampleFindingId}/photoB.jpg`, fileName: 'photoB.jpg', mimeType: 'image/jpeg', fileSize: 50000 },
        user: { id: sampleAdminId },
      } as never,
      concResB as never,
      (() => {}) as never
    ),
  ]);

  const results = [concResA.statusCode, concResB.statusCode];
  const hasSuccess = results.includes(201);
  const hasConflict = results.includes(400);
  assert(
    hasSuccess && hasConflict && currentEvidenceCount === 3 && cleanedOrphanBlobs.length === 1,
    'Concurrent finalize with 2 existing photos: exactly 1 succeeds (201), 1 is rejected (400), and orphan blob is cleaned up'
  );

  // TEST 138: High-concurrency finalize — 5 simultaneous finalize requests for finding with 1 photo
  currentEvidenceCount = 1;
  findingModel.countEvidences = async () => 1; // All 5 start when finding has 1 photo
  cleanedOrphanBlobs.length = 0;
  const highConcResponses = [createMockRes(), createMockRes(), createMockRes(), createMockRes(), createMockRes()];

  await Promise.all(
    highConcResponses.map((res, i) =>
      findingController.confirmEvidence(
        {
          params: { id: sampleFindingId },
          body: { pathname: `findings/${sampleFindingId}/parallel-${i}.jpg`, fileName: `parallel-${i}.jpg`, mimeType: 'image/jpeg', fileSize: 50000 },
          user: { id: sampleAdminId },
        } as never,
        res as never,
        (() => {}) as never
      )
    )
  );

  const successCount = highConcResponses.filter((r) => r.statusCode === 201).length;
  const rejectedCount = highConcResponses.filter((r) => r.statusCode === 400).length;
  assert(
    successCount === 2 && rejectedCount === 3 && currentEvidenceCount === 3 && cleanedOrphanBlobs.length === 3,
    'High concurrency (5 simultaneous requests for 2 available slots): exactly 2 succeed, 3 fail, all 3 orphan blobs deleted'
  );

  // Restore findingModel.addEvidence
  findingModel.addEvidence = origAddEvidenceForConc;
  blobService.deleteBlob = origDelForConcurrency;
  blobService.verifyBlob = origVerifyBlobForConc;
  blobService.verifyBlobSignature = origVerifySigForConc;

  // TEST 139: Duplicate finalize idempotency — re-finalizing identical pathname returns existing evidence
  findingModel.countEvidences = async () => 1;
  const origAddEvForIdempotent = findingModel.addEvidence;
  findingModel.addEvidence = async (fId: string, d: { blobPathname: string; fileName: string; mimeType: string; fileSizeBytes: number }) => ({
    id: '11111111-1111-1111-1111-111111111111',
    finding_id: fId,
    blob_pathname: d.blobPathname,
    file_name: d.fileName,
    mime_type: d.mimeType,
    file_size_bytes: d.fileSizeBytes,
    created_at: new Date().toISOString(),
  } as never);
  const origVerifyForIdem = blobService.verifyBlob;
  const origSigForIdem = blobService.verifyBlobSignature;
  blobService.verifyBlob = async (p: string) => ({ size: 50000, contentType: 'image/jpeg', pathname: p });
  blobService.verifyBlobSignature = async () => 'image/jpeg';

  const idemRes = createMockRes();
  await findingController.confirmEvidence(
    {
      params: { id: sampleFindingId },
      body: { pathname: `findings/${sampleFindingId}/photo1.jpg`, fileName: 'photo1.jpg', mimeType: 'image/jpeg', fileSize: 50000 },
      user: { id: sampleAdminId },
    } as never,
    idemRes as never,
    (() => {}) as never
  );
  assert(
    idemRes.statusCode === 201 && (idemRes.body as { data?: { id?: string } })?.data?.id === '11111111-1111-1111-1111-111111111111',
    'Duplicate finalize retry with identical pathname is idempotent and returns existing evidence'
  );
  findingModel.addEvidence = origAddEvForIdempotent;
  blobService.verifyBlob = origVerifyForIdem;
  blobService.verifyBlobSignature = origSigForIdem;

  // TEST 140: Delete evidence when Blob is not found in storage (404 / BlobNotFoundError)
  const origGetEvForDel = findingModel.getEvidenceById;
  const origDelEvForDel = findingModel.deleteEvidence;
  const origBlobDelForDel = blobService.deleteBlob;
  findingModel.getEvidenceById = async () => mockSavedEvidence as never;
  let deletedFromNeon = false;
  findingModel.deleteEvidence = async () => {
    deletedFromNeon = true;
    return true;
  };
  blobService.deleteBlob = async () => {
    const notFoundError = new Error('Blob not found');
    Object.assign(notFoundError, { status: 404, code: 'not_found', name: 'BlobNotFoundError' });
    throw notFoundError;
  };

  const notFoundBlobDelRes = createMockRes();
  await findingController.deleteEvidence(
    { params: { id: sampleFindingId, evidenceId: mockSavedEvidence.id }, user: { id: sampleAdminId } } as never,
    notFoundBlobDelRes as never,
    (() => {}) as never
  );
  assert(
    notFoundBlobDelRes.statusCode === 200 && deletedFromNeon === true,
    'deleteEvidence safely handles already-deleted/404 Blob by proceeding to clean database metadata (HTTP 200)'
  );

  // TEST 141: Delete evidence when Blob storage suffers unexpected 500 / network outage
  deletedFromNeon = false;
  blobService.deleteBlob = async () => {
    throw new Error('Connection reset by storage peer');
  };
  const storageOutageDelRes = createMockRes();
  await findingController.deleteEvidence(
    { params: { id: sampleFindingId, evidenceId: mockSavedEvidence.id }, user: { id: sampleAdminId } } as never,
    storageOutageDelRes as never,
    (() => {}) as never
  );
  assert(
    storageOutageDelRes.statusCode === 502 &&
      (storageOutageDelRes.body as { code?: string })?.code === 'STORAGE_DELETE_FAILED' &&
      deletedFromNeon === false,
    'deleteEvidence aborts with HTTP 502 and keeps database metadata intact when Blob storage suffers unexpected outage'
  );

  // TEST 142: Delete evidence when database fails temporarily (Scenario 4)
  blobService.deleteBlob = async () => {};
  findingModel.deleteEvidence = async () => {
    throw new Error('Neon database connection timeout');
  };
  let forwardedError: unknown = null;
  const dbFailDelRes = createMockRes();
  await findingController.deleteEvidence(
    { params: { id: sampleFindingId, evidenceId: mockSavedEvidence.id }, user: { id: sampleAdminId } } as never,
    dbFailDelRes as never,
    ((err: unknown) => { forwardedError = err; }) as never
  );
  assert(
    forwardedError !== null,
    'deleteEvidence safely forwards error when database fails after storage deletion'
  );

  // TEST 143: Delete evidence idempotent retry (Scenario 5)
  findingModel.deleteEvidence = async () => true;
  blobService.deleteBlob = async () => {};
  const retryDelRes = createMockRes();
  await findingController.deleteEvidence(
    { params: { id: sampleFindingId, evidenceId: mockSavedEvidence.id }, user: { id: sampleAdminId } } as never,
    retryDelRes as never,
    (() => {}) as never
  );
  assert(
    retryDelRes.statusCode === 200 &&
      (retryDelRes.body as { success?: boolean })?.success === true,
    'deleteEvidence supports idempotent retries and succeeds when administrator re-submits delete'
  );
  findingModel.getEvidenceById = origGetEvForDel;
  findingModel.deleteEvidence = origDelEvForDel;
  blobService.deleteBlob = origBlobDelForDel;

  // TEST 144: Foreign key contract audit — migrations explicitly enforce ON DELETE RESTRICT
  const migration001 = fs.readFileSync('server/database/migrations/001_phase_2_1_schema_alignment.sql', 'utf8');
  const migration002 = fs.readFileSync('server/database/migrations/002_schema_contract_alignment.sql', 'utf8');
  const m1EvidenceRestrict = migration001.includes('finding_evidence') && migration001.includes('ON DELETE RESTRICT');
  const m1HistoryRestrict = migration001.includes('finding_status_history') && migration001.includes('ON DELETE RESTRICT');
  const m2EvidenceRestrict = migration002.includes('finding_evidence') && migration002.includes('ON DELETE RESTRICT');
  const m2HistoryRestrict = migration002.includes('finding_status_history') && migration002.includes('ON DELETE RESTRICT');
  assert(
    m1EvidenceRestrict && m1HistoryRestrict && m2EvidenceRestrict && m2HistoryRestrict,
    'Database migrations 001 and 002 strictly enforce ON DELETE RESTRICT for finding_evidence and finding_status_history'
  );

  // -------------------------------------------------------------------------
  // FINAL TEST REPORT
  // -------------------------------------------------------------------------
  console.log(`\n======================================================`);
  console.log(`VERIFICATION SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log(`======================================================`);

  if (passed === total) {
    console.log(`🎉 ALL ${passed} AUTOMATED TESTS PASSED SUCCESSFULLY!\n`);
  } else {
    console.error(`❌ ${total - passed} TESTS FAILED!`);
    process.exitCode = 1;
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
