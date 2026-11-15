/**
 * SPLD SAFETY - Final Project Refactoring
 * Comprehensive Verification Test Suite for Phase 1: Frontend Restructuring
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
  console.log('=== STARTING SPLD SAFETY PHASE 1 VERIFICATION TESTS ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      process.exitCode = 1;
    }
  }

  // -------------------------------------------------------------------------
  // 1. DATASET & TAXONOMY INTEGRITY (12 Demo Findings)
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
  // 2. MOCK AUTHENTICATION SERVICE
  // -------------------------------------------------------------------------
  console.log('\n[2. MOCK AUTHENTICATION SERVICE]');

  const testAuth = new MockAuthService();

  // TEST 11: Initial unauthenticated state
  await testAuth.logout();
  assert(
    !testAuth.isAuthenticated() && testAuth.getCurrentUser() === null,
    'MockAuthService starts unauthenticated after logout'
  );

  // TEST 12: Successful demo administrator login
  const loginResult = await testAuth.login({
    email: DEMO_ADMIN_USER.email,
    password: 'any-password',
  });
  assert(
    testAuth.isAuthenticated() &&
      loginResult.user.email === DEMO_ADMIN_USER.email &&
      testAuth.getSession()?.isDemo === true,
    'MockAuthService authenticates demo admin and sets isDemo flag'
  );

  // TEST 13: Profile update within demo session
  const updatedUser = await testAuth.updateProfile({
    name: 'Administrator Updated',
    email: 'admin.updated@toyota.co.id',
    phone: '0812-9999-8888',
    position: 'Senior Safety Lead',
    department: 'QSHE & Jiritsuka',
  });
  assert(
    testAuth.getCurrentUser()?.name === 'Administrator Updated' &&
      updatedUser.email === 'admin.updated@toyota.co.id',
    'MockAuthService updateProfile updates current user in session'
  );

  // TEST 14: Logout terminates session
  await testAuth.logout();
  assert(
    !testAuth.isAuthenticated(),
    'MockAuthService logout clears session successfully'
  );

  // -------------------------------------------------------------------------
  // 3. MOCK FINDING SERVICE
  // -------------------------------------------------------------------------
  console.log('\n[3. MOCK FINDING SERVICE]');

  const findingService = new MockFindingService();

  // TEST 15: Retrieve all initial findings
  const initialFindings = await findingService.getFindings();
  assert(
    initialFindings.length === 12,
    `getFindings() returns 12 initial findings (got ${initialFindings.length})`
  );

  // TEST 16: Search filter by reference number
  const searchByRef = await findingService.getFindings({ search: 'FND-2026-0004' });
  assert(
    searchByRef.length === 1 && searchByRef[0].referenceNo === 'FND-2026-0004',
    'getFindings({ search: "FND-2026-0004" }) returns exactly 1 matching finding'
  );

  // TEST 17: Search filter by keyword in title
  const searchByTitle = await findingService.getFindings({ search: 'forklift' });
  assert(
    searchByTitle.length >= 1 &&
      searchByTitle.some((f) => f.title.toLowerCase().includes('forklift')),
    'getFindings({ search: "forklift" }) returns matching findings'
  );

  // TEST 18: Filter by status
  const openFindings = await findingService.getFindings({ status: 'OPEN' });
  assert(
    openFindings.length > 0 && openFindings.every((f) => f.status === 'OPEN'),
    `getFindings({ status: "OPEN" }) returns only OPEN records (found ${openFindings.length})`
  );

  // TEST 19: Filter by risk level
  const criticalFindings = await findingService.getFindings({ riskLevel: 'Critical' });
  assert(
    criticalFindings.length === 2 && criticalFindings.every((f) => f.riskLevel === 'Critical'),
    'getFindings({ riskLevel: "Critical" }) returns exactly 2 Critical records'
  );

  // TEST 20: Filter by department
  const warehouseFindings = await findingService.getFindings({ department: 'Warehouse' });
  assert(
    warehouseFindings.length === 2 &&
      warehouseFindings.every((f) => f.reporterDepartment === 'Warehouse'),
    'getFindings({ department: "Warehouse" }) returns exactly 2 records'
  );

  // TEST 21: Get finding by ID
  const foundItem = await findingService.getFindingById('fnd-2026-0001');
  assert(
    foundItem !== null && foundItem.referenceNo === 'FND-2026-0001',
    'getFindingById("fnd-2026-0001") returns the correct record'
  );

  // TEST 22: Get finding with nonexistent ID returns null
  const notFoundItem = await findingService.getFindingById('non-existent-id');
  assert(
    notFoundItem === null,
    'getFindingById with nonexistent ID returns null'
  );

  // TEST 23: Create new finding auto-generates FND-2026-0013 and starts at OPEN
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
  });
  assert(
    createdFinding.referenceNo === 'FND-2026-0013' && createdFinding.status === 'OPEN',
    `createFinding creates record with ref "FND-2026-0013" and status "OPEN" (got ${createdFinding.referenceNo})`
  );

  // TEST 24: Total findings incremented to 13
  const afterCreate = await findingService.getFindings();
  assert(
    afterCreate.length === 13,
    `Total findings incremented to 13 after creation (got ${afterCreate.length})`
  );

  // TEST 25: Status lifecycle transition from OPEN -> IN_PROGRESS -> CLOSED
  const updatedToProgress = await findingService.updateStatus(createdFinding.id, 'IN_PROGRESS');
  assert(
    updatedToProgress.status === 'IN_PROGRESS',
    'updateStatus transitions record from OPEN to IN_PROGRESS'
  );

  const updatedToClosed = await findingService.updateStatus(createdFinding.id, 'CLOSED');
  assert(
    updatedToClosed.status === 'CLOSED',
    'updateStatus transitions record from IN_PROGRESS to CLOSED'
  );

  // TEST 26: Archive finding removes it from active list
  await findingService.archiveFinding(createdFinding.id);
  const afterArchive = await findingService.getFindings();
  assert(
    afterArchive.length === 12 && !afterArchive.some((f) => f.id === createdFinding.id),
    'archiveFinding excludes record from active getFindings() list'
  );

  // -------------------------------------------------------------------------
  // 4. MOCK DASHBOARD SERVICE & KPI CALCULATION
  // -------------------------------------------------------------------------
  console.log('\n[4. MOCK DASHBOARD SERVICE & KPI CALCULATION]');

  // Reset to original 12 demo findings for pristine dashboard verification
  findingService.resetToDemoData();
  const dashboardService = new MockDashboardService();

  const dashboardData = await dashboardService.getDashboardData();

  // TEST 27: Total findings KPI is 12
  assert(
    dashboardData.kpis.totalFindings === 12,
    `Total findings KPI is 12 (got ${dashboardData.kpis.totalFindings})`
  );

  // TEST 28: Status KPIs sum equals total findings
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

  // TEST 29: High Risk KPI includes High + Critical
  // High = 3, Critical = 2 -> High Risk = 5
  assert(
    dashboardData.kpis.highRiskFindings === 5,
    `High Risk KPI equals 5 (High: 3 + Critical: 2, got ${dashboardData.kpis.highRiskFindings})`
  );

  // TEST 30: Monthly trend data is aggregated chronologically
  assert(
    dashboardData.monthlyTrend.length > 0 &&
      dashboardData.monthlyTrend.reduce((acc, m) => acc + m.count, 0) === 12,
    `Monthly trend total points sum to 12 findings`
  );

  // TEST 31: Risk distribution percentages sum to ~100%
  const riskTotalPct = dashboardData.riskDistribution.reduce((acc, r) => acc + r.percentage, 0);
  assert(
    riskTotalPct >= 99 && riskTotalPct <= 101,
    `Risk distribution percentages sum to ~100% (got ${riskTotalPct}%)`
  );

  // TEST 32: Category distribution percentages sum to ~100%
  const catTotalPct = dashboardData.categoryDistribution.reduce((acc, c) => acc + c.percentage, 0);
  assert(
    catTotalPct >= 99 && catTotalPct <= 101,
    `Category distribution percentages sum to ~100% (got ${catTotalPct}%)`
  );

  // TEST 33: Recent findings has exactly 5 items
  assert(
    dashboardData.recentFindings.length === 5,
    `Recent findings list has exactly 5 items (got ${dashboardData.recentFindings.length})`
  );

  // TEST 34: Dashboard filtering by department adjusts KPIs consistently
  const filteredDashboard = await dashboardService.getDashboardData({
    department: 'Warehouse',
  });
  assert(
    filteredDashboard.kpis.totalFindings === 2,
    `Dashboard filter by department "Warehouse" shows 2 findings (got ${filteredDashboard.kpis.totalFindings})`
  );

  // -------------------------------------------------------------------------
  // 5. VALIDATION SCHEMAS
  // -------------------------------------------------------------------------
  console.log('\n[5. FORM VALIDATION SCHEMAS]');

  // TEST 35: Login schema valid input
  const validLogin = loginSchema.safeParse({
    email: 'admin@toyota.co.id',
    password: 'password123',
  });
  assert(validLogin.success, 'loginSchema accepts valid email and password');

  // TEST 36: Login schema invalid email
  const invalidEmailLogin = loginSchema.safeParse({
    email: 'not-an-email',
    password: 'password123',
  });
  assert(!invalidEmailLogin.success, 'loginSchema rejects invalid email format');

  // TEST 37: Finding form valid input
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

  // TEST 38: Finding form requires otherDepartmentName when department is "Lain-lain"
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

  // TEST 39: Profile form valid input
  const validProfile = profileFormSchema.safeParse({
    name: 'Administrator Demo',
    email: 'admin@toyota.co.id',
    phone: '081234567890',
    position: 'Safety Lead',
    department: 'QSHE & Jiritsuka',
  });
  assert(validProfile.success, 'profileFormSchema accepts valid profile data');

  // TEST 40: Profile form invalid phone
  const invalidPhoneProfile = profileFormSchema.safeParse({
    name: 'Administrator Demo',
    email: 'admin@toyota.co.id',
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
    console.log('🎉 ALL 40 AUTOMATED TESTS PASSED SUCCESSFULLY!\n');
  } else {
    console.error(`❌ ${total - passed} TESTS FAILED!`);
    process.exitCode = 1;
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
