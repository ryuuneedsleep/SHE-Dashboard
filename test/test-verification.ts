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
} from '../src/types/finding.ts';
import { MockAuthService, DEMO_ADMIN_USER } from '../src/services/mock/mockAuthService.ts';
import { MockFindingService } from '../src/services/mock/mockFindingService.ts';
import { MockDashboardService } from '../src/services/mock/mockDashboardService.ts';
import { loginSchema, findingFormSchema, profileFormSchema } from '../src/utils/validation.ts';

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

  // TEST 47: Profile form valid input
  const validProfile = profileFormSchema.safeParse({
    name: 'Administrator Demo',
    email: 'admin@spld-safety.test',
    phone: '081234567890',
    position: 'Safety Lead',
    department: 'QSHE & Jiritsuka',
  });
  assert(validProfile.success, 'profileFormSchema accepts valid profile data');

  // TEST 48: Profile form invalid phone
  const invalidPhoneProfile = profileFormSchema.safeParse({
    name: 'Administrator Demo',
    email: 'admin@spld-safety.test',
    phone: '12345',
    position: 'Safety Lead',
    department: 'QSHE & Jiritsuka',
  });
  assert(!invalidPhoneProfile.success, 'profileFormSchema rejects invalid phone format');

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
