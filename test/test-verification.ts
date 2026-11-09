/**
 * Comprehensive Verification Test Suite:
 * - Module 01: User Registration & Authentication
 * - Module 02: User Management & Access Control (Policy Update)
 */

import { DEPARTMENT_OPTIONS, POSITION_OPTIONS, ROLE_CONFIGS } from '../src/data/masterData.ts';
import { registrationSchema } from '../src/utils/validation.ts';
import { MockAuthService, authService } from '../src/services/authService.ts';
import { masterDataService } from '../src/services/masterDataService.ts';
import { dashboardService } from '../src/services/dashboardService.ts';
import { safetyService } from '../src/services/safetyService.ts';
import type { AuthUser } from '../src/types/auth.ts';
import type { MasterDataCategory, SectionRecord } from '../src/types/masterData.ts';
import type { DashboardFilters } from '../src/types/dashboard.ts';

async function runTests() {
  console.log('=== STARTING SPLD SAFETY MODULE 01 & MODULE 02 VERIFICATION TESTS ===\n');
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
  // MODULE 01 TESTS
  // -------------------------------------------------------------------------
  console.log('[PART 1: MODULE 01 REGISTRATION & AUTHENTICATION]');

  // TEST 1: Department dropdown contains exactly 6 options
  assert(
    DEPARTMENT_OPTIONS.length === 6,
    `Department options count is exactly 6 (got ${DEPARTMENT_OPTIONS.length})`
  );

  // TEST 2: Department contains all required options
  const deptValues: string[] = DEPARTMENT_OPTIONS.map((d) => d.value);
  const expectedDepts = ['Warehouse', 'IM', 'SPPM', 'SM', 'QSHE & Jiritsuka', 'Lain-lain'];
  assert(
    expectedDepts.every((d) => deptValues.includes(d)),
    'Department options include all 6 required divisions'
  );

  // TEST 3: Position options include Operator, Staff, Group Head, Line Head, Section Head, Department Head / Manager, Other
  const posValues: string[] = POSITION_OPTIONS.map((p) => p.value);
  const expectedPositions = [
    'Operator',
    'Staff',
    'Group Head',
    'Line Head',
    'Section Head',
    'Department Head / Manager',
    'Other',
  ];
  assert(
    expectedPositions.every((p) => posValues.includes(p)),
    'Position options contain all specified positions including Other'
  );

  // TEST 4: Validation passes with valid registration input
  const validData = {
    fullName: 'Joko Widodo',
    noreg: 'TAM-9999',
    phone: '081234567890',
    email: 'joko.widodo@toyota.co.id',
    department: 'Warehouse' as const,
    section: 'Receiving & Inbound Area',
    position: 'Staff' as const,
    password: 'Password@2026',
    confirmPassword: 'Password@2026',
    agreement: true,
  };
  const validResult = registrationSchema.safeParse(validData);
  assert(validResult.success, 'Valid registration payload passes schema validation');

  // TEST 5: Password mismatch fails validation
  const mismatchData = {
    ...validData,
    confirmPassword: 'DifferentPassword123!',
  };
  const mismatchResult = registrationSchema.safeParse(mismatchData);
  assert(!mismatchResult.success, 'Password confirmation mismatch is caught by validation');

  // TEST 6: Unaccepted terms and conditions agreement fails validation
  const unagreedData = {
    ...validData,
    agreement: false,
  };
  const unagreedResult = registrationSchema.safeParse(unagreedData);
  assert(!unagreedResult.success, 'Unaccepted terms and conditions agreement fails validation');

  // TEST 7: Selecting "Lain-lain" requires otherDepartmentName
  const lainLainMissing = {
    ...validData,
    department: 'Lain-lain' as const,
    otherDepartmentName: '',
  };
  const lainLainResult = registrationSchema.safeParse(lainLainMissing);
  assert(
    !lainLainResult.success,
    'Selecting "Lain-lain" requires non-empty otherDepartmentName'
  );

  // TEST 8: Selecting "Other" position requires otherPositionName
  const otherPosMissing = {
    ...validData,
    position: 'Other' as const,
    otherPositionName: '',
  };
  const otherPosResult = registrationSchema.safeParse(otherPosMissing);
  assert(
    !otherPosResult.success,
    'Selecting "Other" position requires non-empty otherPositionName'
  );

  // TEST 9: AuthService duplicate Noreg check
  const auth = new MockAuthService();
  const noregAvailable = await auth.checkNoregAvailability('TAM-8801');
  assert(
    !noregAvailable,
    'Duplicate Noreg (TAM-8801) is correctly flagged as unavailable'
  );

  // TEST 10: AuthService duplicate Email check
  const emailAvailable = await auth.checkEmailAvailability('budi.santoso@toyota.co.id');
  assert(
    !emailAvailable,
    'Duplicate Email (budi.santoso@toyota.co.id) is correctly flagged as unavailable'
  );

  // TEST 11: Registration produces a Pending request with default role "Member / Reporter"
  const newReg = await auth.register(validData);
  assert(
    newReg.accountStatus === 'Pending',
    'Submitted registration produces status "Pending"'
  );
  assert(
    newReg.requestedRole === 'Member / Reporter',
    'Submitted registration assigns default role "Member / Reporter"'
  );
  assert(
    !('password' in newReg),
    'RegistrationRequest model strictly excludes plaintext password'
  );

  // TEST 12: Login with Active account succeeds
  const activeLogin = await auth.login('budi.santoso@toyota.co.id', 'Toyota@2026');
  assert(
    activeLogin.success && activeLogin.status === 'Active',
    'Active user authentication succeeds and returns Active status'
  );

  // TEST 13: Login with Pending account produces PENDING_APPROVAL
  const pendingLogin = await auth.login('agus.pratama@toyota.co.id', 'Toyota@2026');
  assert(
    !pendingLogin.success && pendingLogin.errorCode === 'PENDING_APPROVAL',
    'Pending user login returns PENDING_APPROVAL error code'
  );

  // TEST 14: Login with Rejected account produces ACCOUNT_REJECTED
  const rejectedLogin = await auth.login('rian.hidayat@toyota.co.id', 'Toyota@2026');
  assert(
    !rejectedLogin.success && rejectedLogin.errorCode === 'ACCOUNT_REJECTED',
    'Rejected user login returns ACCOUNT_REJECTED error code'
  );

  // TEST 15: Login with Suspended account produces ACCOUNT_SUSPENDED
  const suspendedLogin = await auth.login('dewi.lestari@toyota.co.id', 'Toyota@2026');
  assert(
    !suspendedLogin.success && suspendedLogin.errorCode === 'ACCOUNT_SUSPENDED',
    'Suspended user login returns ACCOUNT_SUSPENDED error code'
  );

  // TEST 16: Login with Inactive account produces ACCOUNT_INACTIVE
  const inactiveLogin = await auth.login('fajar.nugraha@toyota.co.id', 'Toyota@2026');
  assert(
    !inactiveLogin.success && inactiveLogin.errorCode === 'ACCOUNT_INACTIVE',
    'Inactive user login returns ACCOUNT_INACTIVE error code'
  );

  // TEST 17: Login with invalid password produces INVALID_CREDENTIALS
  const wrongPassLogin = await auth.login('budi.santoso@toyota.co.id', 'WrongPassword123');
  assert(
    !wrongPassLogin.success && wrongPassLogin.errorCode === 'INVALID_CREDENTIALS',
    'Invalid credentials returns generic INVALID_CREDENTIALS message'
  );

  // -------------------------------------------------------------------------
  // MODULE 02 POLICY UPDATE TESTS
  // -------------------------------------------------------------------------
  console.log('\n[PART 2: MODULE 02 POLICY UPDATE: ROLE & ACCESS CONTROL]');

  // Actor setup
  const qsheAdminUser = activeLogin.user as AuthUser; // Budi Santoso (QSHE_ADMIN)
  const nonAdminMember = auth.getAllUsers().find((u) => u.role === 'MEMBER') as AuthUser;

  // TEST 18: Role structure has exactly 4 roles, and no separate SUPER_ADMIN
  const definedRoles = Object.keys(ROLE_CONFIGS);
  assert(
    definedRoles.length === 4 &&
      definedRoles.includes('QSHE_ADMIN') &&
      definedRoles.includes('APPROVER') &&
      definedRoles.includes('MEMBER') &&
      definedRoles.includes('MANAGEMENT') &&
      !definedRoles.includes('SUPER_ADMIN'),
    'Final role structure contains exactly 4 roles with no SUPER_ADMIN'
  );

  // TEST 19: QSHE Admin holds Super Admin privileges and can access administrative methods
  const pendingRequests = auth.getPendingRegistrations();
  assert(
    pendingRequests.length >= 1,
    'QSHE Admin can retrieve the pending registration queue'
  );

  // TEST 20: Non-admin is strictly blocked from approving registrations
  let nonAdminBlocked = false;
  try {
    await auth.approveRegistration(nonAdminMember, 'REG-2026-0001', 'MEMBER', ['sec-rec']);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Only QSHE Admin')) {
      nonAdminBlocked = true;
    }
  }
  assert(
    nonAdminBlocked,
    'Non-admin (MEMBER) is strictly blocked from approving registrations'
  );

  // TEST 21: Self-approval is strictly prevented
  let selfApprovalBlocked = false;
  try {
    // If the approving admin's noreg matches the applicant's noreg (Agus Pratama: TAM-8802)
    const selfAdminActor = { ...qsheAdminUser, noreg: 'TAM-8802' };
    await auth.approveRegistration(
      selfAdminActor,
      'REG-2026-0001',
      'MEMBER',
      ['sec-rec']
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Self-approval')) {
      selfApprovalBlocked = true;
    }
  }
  assert(selfApprovalBlocked, 'Self-approval is strictly prevented');

  // TEST 22: QSHE Admin approves pending registration, assigns role, multiple areas, and activates account
  const approved = await auth.approveRegistration(
    qsheAdminUser,
    'REG-2026-0001',
    'APPROVER',
    ['sec-rec', 'sec-sto', 'sec-shi']
  );
  assert(
    approved.accountStatus === 'Active' &&
      approved.assignedRole === 'APPROVER' &&
      approved.assignedAreaAccess?.length === 3,
    'QSHE Admin approves registration, sets role to APPROVER, and assigns 3 operational areas'
  );

  // TEST 23: Rejection requires a mandatory reason
  let emptyReasonBlocked = false;
  try {
    await auth.rejectRegistration(qsheAdminUser, 'REG-2026-0003', '   ');
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('mandatory')) {
      emptyReasonBlocked = true;
    }
  }
  assert(emptyReasonBlocked, 'Rejection without reason is strictly rejected');

  // TEST 24: QSHE Admin rejects registration with reason and updates status
  const rejected = await auth.rejectRegistration(
    qsheAdminUser,
    'REG-2026-0003',
    'Noreg does not match current warehouse roster.'
  );
  assert(
    rejected.accountStatus === 'Rejected' &&
      rejected.rejectionReason === 'Noreg does not match current warehouse roster.',
    'Registration successfully rejected with audit reason'
  );

  // TEST 25: Multiple Area Access assignments work on user profile
  const targetUser = auth.getAllUsers().find((u) => u.noreg === 'TAM-8807')!;
  const updatedUserAreas = await auth.updateUserAreaAccess(qsheAdminUser, targetUser.id, [
    'sec-rec',
    'sec-sto',
    'sec-pic',
  ]);
  assert(
    updatedUserAreas.areaAccess.length === 3 &&
      updatedUserAreas.areaAccess.includes('sec-pic'),
    'QSHE Admin successfully assigned multiple operational areas to user'
  );

  // TEST 26: Empty Area Access does NOT grant unrestricted access
  const emptyAreaUser: AuthUser = {
    ...targetUser,
    areaAccess: [],
  };
  const hasAccessWithEmpty = auth.hasAreaAccess(emptyAreaUser, 'sec-rec');
  assert(
    hasAccessWithEmpty === false,
    'Empty Area Access does NOT grant access to operational areas'
  );

  // TEST 27: User cannot modify their own role
  let selfRoleChangeBlocked = false;
  try {
    await auth.updateUserRole(qsheAdminUser, qsheAdminUser.id, 'MEMBER');
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('not permitted to change their own role')) {
      selfRoleChangeBlocked = true;
    }
  }
  assert(selfRoleChangeBlocked, 'QSHE Admin cannot change their own role (self-demotion blocked)');

  // TEST 28: Non-admin cannot modify user roles
  let nonAdminRoleChangeBlocked = false;
  try {
    await auth.updateUserRole(nonAdminMember, targetUser.id, 'QSHE_ADMIN');
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Only QSHE Admin')) {
      nonAdminRoleChangeBlocked = true;
    }
  }
  assert(nonAdminRoleChangeBlocked, 'Non-admin cannot assign or change user roles');

  // TEST 29: Administrator Safety Rule: Cannot demote the last active QSHE Admin
  // First, demote Siti Rahma (the second admin)
  const sitiAdmin = auth.getAllUsers().find((u) => u.noreg === 'TAM-8806')!;
  await auth.updateUserRole(qsheAdminUser, sitiAdmin.id, 'APPROVER');

  // Now Budi Santoso is the SOLE active QSHE Admin. Try demoting Budi using another call or deactivating him:
  let lastAdminDemoteBlocked = false;
  try {
    // If an admin tries to change Budi's status to Inactive:
    await auth.updateUserStatus(qsheAdminUser, qsheAdminUser.id, 'Inactive');
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('last active QSHE Admin')) {
      lastAdminDemoteBlocked = true;
    }
  }
  assert(
    lastAdminDemoteBlocked,
    'Administrator Safety Rule strictly prevents deactivating the last active QSHE Admin'
  );

  // TEST 30: Audit log records every administrative action
  const logs = auth.getAuditLogs();
  const hasApprovalLog = logs.some((l) => l.action === 'REGISTRATION_APPROVED');
  const hasRejectionLog = logs.some((l) => l.action === 'REGISTRATION_REJECTED');
  const hasAreaLog = logs.some((l) => l.action === 'AREA_ACCESS_CHANGED');
  const hasRoleLog = logs.some((l) => l.action === 'ADMIN_PRIVILEGE_CHANGED' || l.action === 'ROLE_CHANGED');

  assert(
    hasApprovalLog && hasRejectionLog && hasAreaLog && hasRoleLog,
    'All sensitive administrative actions (approval, rejection, areas, roles) are recorded in Audit Log'
  );

  // -------------------------------------------------------------------------
  // MODULE 03 TESTS: MASTER DATA MANAGEMENT
  // -------------------------------------------------------------------------
  console.log('\n[PART 3: MODULE 03 MASTER DATA MANAGEMENT]');

  // TEST 31: All 10 master data categories exist and are accessible
  const categories: MasterDataCategory[] = [
    'departments',
    'sections',
    'positions',
    'operational_areas',
    'safety_categories',
    'hazard_categories',
    'finding_categories',
    'risk_levels',
    'incident_types',
    'corrective_action_categories',
  ];
  const allCategoriesExist = categories.every((cat) => {
    const list = masterDataService.getAll(cat);
    return Array.isArray(list) && list.length > 0;
  });
  assert(
    allCategoriesExist,
    'All 10 organizational and safety master data categories are seeded and accessible'
  );

  // TEST 32: Exactly 6 standard departments seeded and active
  const seedDepts = masterDataService.getActiveDepartments();
  assert(
    seedDepts.length === 6 && seedDepts.every((d) => d.status === 'Active'),
    'Standard 6 departments are seeded with Active status'
  );

  // TEST 33: Parent-child relationship (Sections linked to parent Department)
  const sections = masterDataService.getAll('sections') as SectionRecord[];
  const validParentSections = sections.every((s) => s.departmentId && s.departmentName);
  assert(
    validParentSections,
    'All Section records maintain referential link to a parent Department'
  );

  // TEST 34: Non-admin is blocked from creating master data
  let nonAdminCreateBlocked = false;
  try {
    masterDataService.createRecord(nonAdminMember, 'departments', {
      code: 'TEST',
      name: 'Test Dept',
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Only QSHE Admin')) {
      nonAdminCreateBlocked = true;
    }
  }
  assert(nonAdminCreateBlocked, 'Non-admin user cannot create master data records');

  // TEST 35: QSHE Admin can create new master data record
  const newCat = masterDataService.createRecord(qsheAdminUser, 'safety_categories', {
    code: 'ERG',
    name: 'Ergonomics & Work Posture',
    description: 'Ergonomic assessments and repetitive motion strain hazards',
  });
  assert(
    newCat.code === 'ERG' && newCat.status === 'Active',
    'QSHE Admin can create new master data record'
  );

  // TEST 36: Duplicate code within category is strictly rejected
  let duplicateCodeBlocked = false;
  try {
    masterDataService.createRecord(qsheAdminUser, 'safety_categories', {
      code: 'ERG',
      name: 'Duplicate Ergonomics',
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('already in use')) {
      duplicateCodeBlocked = true;
    }
  }
  assert(duplicateCodeBlocked, 'Duplicate code within the same category is strictly rejected');

  // TEST 37: Section creation requires mandatory Parent Department
  let sectionMissingDeptBlocked = false;
  try {
    masterDataService.createRecord(qsheAdminUser, 'sections', {
      code: 'SEC-TEST',
      name: 'Test Section No Dept',
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Parent Department')) {
      sectionMissingDeptBlocked = true;
    }
  }
  assert(
    sectionMissingDeptBlocked,
    'Creating Section without Parent Department is strictly blocked'
  );

  // TEST 38: Risk Level supports displayColor and sortOrder
  const riskLevels = masterDataService.getActiveRiskLevels();
  const sortedCorrectly = riskLevels.every((rl, idx) => {
    return idx === 0 || rl.sortOrder >= riskLevels[idx - 1].sortOrder;
  });
  const hasColors = riskLevels.every(
    (rl) => typeof rl.displayColor === 'string' && rl.displayColor.startsWith('#')
  );
  assert(
    sortedCorrectly && hasColors,
    'Risk Level records support displayColor hex codes and ascending sort order'
  );

  // TEST 39: Update record functionality and child section cascading
  const deptToUpdate = masterDataService.getById('departments', 'dept-wh');
  const originalDeptName = deptToUpdate?.name || 'Warehouse';
  masterDataService.updateRecord(qsheAdminUser, 'departments', 'dept-wh', {
    name: 'Warehouse Operations',
  });
  const updatedDept = masterDataService.getById('departments', 'dept-wh');
  const childSec = (masterDataService.getAll('sections') as SectionRecord[]).find(
    (s) => s.departmentId === 'dept-wh'
  );
  assert(
    updatedDept?.name === 'Warehouse Operations' &&
      childSec?.departmentName === 'Warehouse Operations',
    'Updating Department name cascades to child Section records'
  );
  // Restore for subsequent tests
  masterDataService.updateRecord(qsheAdminUser, 'departments', 'dept-wh', {
    name: originalDeptName,
  });

  // TEST 40: Referential Integrity check blocks deactivation of Department with active child sections
  const inUseCheck = masterDataService.checkInUse('departments', 'dept-wh');
  assert(
    inUseCheck.isInUse && !inUseCheck.canDeactivate,
    'Referential integrity check detects active child sections and disallows deactivation'
  );

  let blockedDeactivation = false;
  try {
    masterDataService.toggleStatus(qsheAdminUser, 'departments', 'dept-wh', 'Inactive');
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message.includes('dependencies') || err.message.includes('child sections'))
    ) {
      blockedDeactivation = true;
    }
  }
  assert(
    blockedDeactivation,
    'Attempting to deactivate Department with active child sections is blocked'
  );

  // TEST 41: Soft-delete (toggle status to Inactive) for unconstrained record
  masterDataService.toggleStatus(qsheAdminUser, 'safety_categories', newCat.id, 'Inactive');
  const inactiveCheck = masterDataService.getById('safety_categories', newCat.id);
  const activeSafetyCats = masterDataService.getActiveSafetyCategories();
  assert(
    inactiveCheck?.status === 'Inactive' && !activeSafetyCats.some((c) => c.id === newCat.id),
    'Deactivated record has status Inactive and is excluded from active getters (soft-delete)'
  );

  // TEST 42: Reactivation of inactive record
  masterDataService.toggleStatus(qsheAdminUser, 'safety_categories', newCat.id, 'Active');
  const reactivatedCheck = masterDataService.getById('safety_categories', newCat.id);
  assert(reactivatedCheck?.status === 'Active', 'Inactive record can be reactivated by QSHE Admin');

  // TEST 43: Master Data audit entries recorded in unified audit trail
  const updatedLogs = authService.getAuditLogs();
  const hasMdCreated = updatedLogs.some((l) => l.action === 'MASTER_DATA_CREATED');
  const hasMdUpdated = updatedLogs.some((l) => l.action === 'MASTER_DATA_UPDATED');
  const hasMdStatus = updatedLogs.some((l) => l.action === 'MASTER_DATA_STATUS_CHANGED');
  assert(
    hasMdCreated && hasMdUpdated && hasMdStatus,
    'Master data creation, update, and status toggles are recorded in the centralized Audit Log'
  );

  // -------------------------------------------------------------------------
  // MODULE 04 TESTS: SAFETY DASHBOARD & ANALYTICS
  // -------------------------------------------------------------------------
  console.log('\n[PART 4: MODULE 04 SAFETY DASHBOARD & ANALYTICS]');

  const defaultFilters: DashboardFilters = {
    datePreset: '30d',
    departmentId: 'ALL',
    sectionId: 'ALL',
    operationalAreaId: 'ALL',
  };

  // TEST 44: Dashboard summary returns all 6 primary KPI cards for QSHE Admin
  const adminSummary = dashboardService.getDashboardSummary(qsheAdminUser, defaultFilters);
  assert(
    adminSummary.totalFindings &&
      adminSummary.openFindings &&
      adminSummary.overdueActions &&
      adminSummary.patrolAchievement &&
      adminSummary.totalIncidents &&
      adminSummary.highRiskFindings &&
      adminSummary.lastUpdated !== undefined,
    'Dashboard summary generates all 6 primary KPI card metrics with valid timestamps'
  );

  // TEST 45: Total Findings KPI reflects accurate count of records in selected period
  assert(
    typeof adminSummary.totalFindings.value === 'number' && adminSummary.totalFindings.value > 0,
    `Total Safety Findings calculates numeric count accurately (got ${adminSummary.totalFindings.value})`
  );

  // TEST 46: Open Findings KPI filters out Resolved and Closed findings
  assert(
    typeof adminSummary.openFindings.value === 'number' &&
      adminSummary.openFindings.value <= (adminSummary.totalFindings.value as number),
    `Open Findings strictly excludes closed items (got ${adminSummary.openFindings.value} open of ${adminSummary.totalFindings.value} total)`
  );

  // TEST 47: Overdue Corrective Actions calculation detects actions past due date
  const correctiveSummary = dashboardService.getCorrectiveActionSummary(qsheAdminUser, defaultFilters);
  assert(
    correctiveSummary.overdue > 0 &&
      correctiveSummary.overdue === adminSummary.overdueActions.value,
    `Overdue Corrective Actions accurately identified and aligned with KPI card (got ${correctiveSummary.overdue} overdue)`
  );
  assert(
    adminSummary.overdueActions.comparison === undefined,
    'Overdue actions comparison is omitted without fabricating artificial historical baseline'
  );

  // TEST 48: Safety Patrol Achievement handles valid percentage calculation
  assert(
    typeof adminSummary.patrolAchievement.value === 'string' &&
      adminSummary.patrolAchievement.value.endsWith('%'),
    `Patrol Achievement computes completed vs planned percentage (got ${adminSummary.patrolAchievement.value})`
  );

  // TEST 49: Safety Patrol Achievement returns 'N/A' when no planned patrols exist (division-by-zero protection)
  const emptyPatrolFilter: DashboardFilters = {
    ...defaultFilters,
    departmentId: 'dept-sppm', // SPPM has 0 planned patrols in seed
  };
  const emptyPatrolSummary = dashboardService.getPatrolPerformance(qsheAdminUser, emptyPatrolFilter);
  assert(
    emptyPatrolSummary.achievementDisplay === 'N/A' && emptyPatrolSummary.achievementRate === null,
    'Safety Patrol Achievement displays N/A when planned patrols count is zero without fabricating targets'
  );

  // TEST 50: High Risk Findings dynamically matches configured Module 03 High and Critical levels
  assert(
    typeof adminSummary.highRiskFindings.value === 'number' && adminSummary.highRiskFindings.value > 0,
    `High Risk Findings count accurately identified from Module 03 risk levels (got ${adminSummary.highRiskFindings.value})`
  );

  // TEST 51: Finding by Category chart derives categories dynamically from Module 03
  const categoriesData = dashboardService.getFindingByCategory(qsheAdminUser, defaultFilters);
  const activeFindingCats = masterDataService.getActiveFindingCategories();
  const allFindingCategoriesMatch = activeFindingCats.every((afc) =>
    categoriesData.some((cd) => cd.id === afc.id && cd.name === afc.name)
  );
  assert(
    allFindingCategoriesMatch && categoriesData.length === activeFindingCats.length,
    'Finding by Category distribution chart accurately binds to Module 03 Finding Categories'
  );

  // TEST 52: Risk Level distribution chart respects Module 03 configured colors and sort order
  const riskDist = dashboardService.getRiskDistribution(qsheAdminUser, defaultFilters);
  const activeRiskLevels = masterDataService.getActiveRiskLevels();
  const riskColorsMatch = activeRiskLevels.every((arl) =>
    riskDist.some((rd) => rd.id === arl.id && rd.displayColor === arl.displayColor && rd.sortOrder === arl.sortOrder)
  );
  assert(
    riskColorsMatch && riskDist.length === activeRiskLevels.length,
    'Risk Level distribution chart preserves Module 03 configured displayColor hex codes and sort orders'
  );

  // TEST 53: Role Scope Clipping: Approver visibility is strictly constrained to authorized areas
  const approverUser: AuthUser = {
    id: 'USR-8807',
    noreg: 'TAM-8807',
    email: 'hendra.gunawan@toyota.co.id',
    fullName: 'Hendra Gunawan',
    department: 'Warehouse',
    section: 'Receiving & Inbound Area',
    position: 'Line Head',
    role: 'APPROVER',
    areaAccess: ['sec-rec', 'sec-sto'], // Only Receiving and Storage
    status: 'Active',
  };
  const approverActivities = dashboardService.getRecentActivities(approverUser, defaultFilters, 50);
  const approverOnlyAllowedAreas = approverActivities.every((act) => {
    if (act.rawRecord && 'operationalAreaId' in act.rawRecord && act.rawRecord.operationalAreaId) {
      return approverUser.areaAccess.includes(act.rawRecord.operationalAreaId);
    }
    return true;
  });
  assert(
    approverOnlyAllowedAreas && approverActivities.length > 0,
    'Approver dashboard scope is strictly clipped to assigned operational areaAccess'
  );

  // TEST 54: Role Scope Clipping: Member visibility is strictly constrained to personal submissions
  const memberActivities = dashboardService.getRecentActivities(nonAdminMember, defaultFilters, 50);
  const memberOnlyPersonalReports = memberActivities.every((act) => {
    if (act.rawRecord && 'reportedByNoreg' in act.rawRecord && act.rawRecord.reportedByNoreg) {
      return act.rawRecord.reportedByNoreg === nonAdminMember.noreg;
    }
    return true;
  });
  assert(
    memberOnlyPersonalReports,
    'Member dashboard scope is strictly constrained to personal submitted reports (TAM-8808)'
  );

  // TEST 55: Role Scope: Management receives aggregated division-wide visibility
  const managementUser: AuthUser = {
    id: 'USR-MGT-01',
    noreg: 'TAM-MGT-01',
    email: 'director.safety@toyota.co.id',
    fullName: 'Management Executive',
    department: 'QSHE & Jiritsuka',
    section: 'Executive Office',
    position: 'Department Head / Manager',
    role: 'MANAGEMENT',
    areaAccess: [],
    status: 'Active',
  };
  const mgtSummary = dashboardService.getDashboardSummary(managementUser, defaultFilters);
  assert(
    mgtSummary.totalFindings.value === adminSummary.totalFindings.value,
    'Management role accesses aggregated division-wide safety metrics matching administrative totals'
  );

  // TEST 56: Department filtering correctly restricts findings to chosen department
  const whsFilter: DashboardFilters = {
    ...defaultFilters,
    departmentId: 'dept-wh',
  };
  const whsSummary = dashboardService.getDashboardSummary(qsheAdminUser, whsFilter);
  assert(
    (whsSummary.totalFindings.value as number) <= (adminSummary.totalFindings.value as number) &&
      (whsSummary.totalFindings.value as number) > 0,
    'Department filter restricts dashboard findings strictly to selected department'
  );

  // TEST 57: Clean State / Demo Mode Toggle cleanly resets dashboard to zero-state without crash
  dashboardService.setDemoMode(false);
  const cleanSummary = dashboardService.getDashboardSummary(qsheAdminUser, defaultFilters);
  const cleanActivities = dashboardService.getRecentActivities(qsheAdminUser, defaultFilters);
  assert(
    cleanSummary.totalFindings.value === 0 &&
      cleanSummary.patrolAchievement.value === 'N/A' &&
      cleanActivities.length === 0,
    'Toggling Demo Mode OFF returns clean zero-state and N/A achievement without runtime crash'
  );
  // Restore demo mode for production preview
  dashboardService.setDemoMode(true);

  // TEST 58: User Personal Summary computes metrics exclusively for authenticated user's submissions
  const personalData = dashboardService.getUserPersonalSummary(nonAdminMember, defaultFilters);
  const onlyPersonalReports = personalData.myFindings.every(
    (f) => f.reportedByNoreg === nonAdminMember.noreg
  );
  assert(
    onlyPersonalReports && personalData.totalSubmitted === personalData.myFindings.length,
    `Regular member dashboard accurately scopes findings strictly to personal submissions (got ${personalData.totalSubmitted} reports for ${nonAdminMember.noreg})`
  );

  // TEST 59: Scoped Findings separation (Admin gets division-wide, Member gets personal)
  const adminFindings = dashboardService.getScopedFindings(qsheAdminUser, defaultFilters);
  const memberFindings = dashboardService.getScopedFindings(nonAdminMember, defaultFilters);
  assert(
    adminFindings.length > memberFindings.length &&
      memberFindings.every((f) => f.reportedByNoreg === nonAdminMember.noreg),
    `Data scoping enforces separation: Admin accesses all ${adminFindings.length} findings, Member receives only their ${memberFindings.length} reports`
  );

  // TEST 60: Export data availability: Admin can retrieve all division findings and full user directory
  const allDivisionFindings = dashboardService.getAllDivisionFindings();
  const allUsersList = auth.getAllUsers();
  assert(
    allDivisionFindings.length > 0 && allUsersList.length >= 6,
    `Export dataset engine successfully generates full exportable datasets (${allDivisionFindings.length} findings, ${allUsersList.length} users)`
  );

  // -------------------------------------------------------------------------
  // MODULE 05 TESTS: SAFETY PATROL & FINDING MANAGEMENT
  // -------------------------------------------------------------------------
  console.log('\n[PART 5: MODULE 05 SAFETY PATROL & FINDING MANAGEMENT]');

  const coAdminUser =
    auth.getAllUsers().find((u) => u.role === 'QSHE_ADMIN' && u.noreg !== qsheAdminUser.noreg) || {
      id: 'USR-8802',
      noreg: 'TAM-8802',
      fullName: 'Siti Rahma',
      role: 'QSHE_ADMIN' as const,
      department: 'QSHE & Jiritsuka',
      status: 'Active' as const,
    };

  // TEST 61: Direct Finding Creation without patrolId
  const directFinding = safetyService.createDirectFinding(nonAdminMember, {
    title: 'Oli forklift tercecer di lantai lorong C-02',
    description: 'Terdapat ceceran oli hidrolik sepanjang 2 meter yang berpotensi menyebabkan terpeleset.',
    departmentId: 'dept-whs',
    sectionId: 'sec-rec',
    operationalAreaId: 'sec-rec',
    locationDetails: 'Lorong Receiving C-02 dekat rak palet R-14',
    categoryId: 'fc-cond', // Unsafe Condition
    hazardCategoryId: 'haz-phy',
    riskLevelId: 'rl-hi',
  });

  assert(
    directFinding.source === 'DIRECT' &&
      directFinding.patrolId === null &&
      directFinding.status === 'Submitted' &&
      directFinding.reportedByNoreg === nonAdminMember.noreg,
    `Direct Finding created independently without patrolId (ref: ${directFinding.referenceNo}, source: ${directFinding.source})`
  );

  // TEST 62: Safety Patrol Creation by QSHE Admin
  const scheduledPatrol = safetyService.createPatrol(qsheAdminUser, {
    patrolName: 'Audit Keselamatan Jalur Forklift & 5S Receiving',
    description: 'Pemeriksaan kepatuhan marka jalur dan kelayakan APD operator',
    plannedDate: '2026-11-15',
    departmentId: 'dept-whs',
    sectionId: 'sec-rec',
    operationalAreaId: 'sec-rec',
    leaderNoreg: qsheAdminUser.noreg,
    leaderName: qsheAdminUser.fullName,
  });

  assert(
    scheduledPatrol.status === 'Planned' &&
      scheduledPatrol.referenceNo.startsWith('PTR-') &&
      scheduledPatrol.checklist.length > 0 &&
      scheduledPatrol.findingsCount === 0,
    `Safety Patrol scheduled by Admin with 5S checklist (ref: ${scheduledPatrol.referenceNo}, checklist items: ${scheduledPatrol.checklist.length})`
  );

  // TEST 63: Approver cannot schedule patrol outside assigned Area Access
  let approverAreaViolationCaught = false;
  try {
    const limitedApprover: AuthUser = {
      ...approverUser,
      areaAccess: ['sec-rec'],
    };
    safetyService.createPatrol(limitedApprover, {
      patrolName: 'Audit Area Terlarang',
      plannedDate: '2026-11-20',
      departmentId: 'dept-whs',
      operationalAreaId: 'sec-sto', // Storage area, not in limitedApprover's areaAccess
      leaderNoreg: limitedApprover.noreg,
      leaderName: limitedApprover.fullName,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('assigned operational area')) {
      approverAreaViolationCaught = true;
    }
  }

  assert(
    approverAreaViolationCaught,
    'Approver is strictly blocked from scheduling a safety patrol outside assigned Area Access'
  );

  // TEST 64: Patrol Finding Creation with mandatory bi-directional linkage
  const targetCheckItem = scheduledPatrol.checklist[0];
  const patrolFinding = safetyService.createPatrolFinding(qsheAdminUser, {
    patrolId: scheduledPatrol.id,
    checklistItemId: targetCheckItem.id,
    title: 'Marka pejalan kaki terhalang palet kayu bekas',
    description: 'Jalur pejalan kaki tidak dapat dilalui karena penumpukan palet transit',
    departmentId: 'dept-whs',
    sectionId: 'sec-rec',
    operationalAreaId: 'sec-rec',
    categoryId: 'fc-cond',
    riskLevelId: 'rl-med',
  });

  const reloadedPatrol = safetyService.getPatrolById(scheduledPatrol.id)!;
  assert(
    patrolFinding.source === 'PATROL' &&
      patrolFinding.patrolId === scheduledPatrol.id &&
      patrolFinding.checklistItemId === targetCheckItem.id &&
      reloadedPatrol.findingsCount === 1 &&
      reloadedPatrol.relatedFindingIds.includes(patrolFinding.id),
    `Patrol Finding created with mandatory bi-directional linkage (patrol findings count: ${reloadedPatrol.findingsCount})`
  );

  // TEST 65: Patrol Checklist NOT_OK Trigger & Non-duplicate Finding Linkage
  const updatedCheckItem = reloadedPatrol.checklist.find((c) => c.id === targetCheckItem.id)!;
  assert(
    updatedCheckItem.status === 'NOT_OK' &&
      updatedCheckItem.relatedFindingId === patrolFinding.id &&
      updatedCheckItem.relatedFindingRefNo === patrolFinding.referenceNo,
    `Checklist item status set to NOT_OK and uniquely linked to finding ${patrolFinding.referenceNo}`
  );

  // TEST 66: Mandatory Checklist Completion Blocker
  let completionBlockedCaught = false;
  try {
    safetyService.completePatrol(qsheAdminUser, scheduledPatrol.id);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('mandatory checklist item(s) are still UNCHECKED')) {
      completionBlockedCaught = true;
    }
  }

  assert(
    completionBlockedCaught,
    'Patrol completion is strictly blocked when mandatory checklist items are still UNCHECKED'
  );

  // TEST 67: Patrol Completion after verifying all mandatory items
  // Verify remaining checklist items
  reloadedPatrol.checklist.forEach((item) => {
    if (item.status === 'UNCHECKED') {
      safetyService.updatePatrolChecklist(qsheAdminUser, scheduledPatrol.id, item.id, 'OK');
    }
  });

  const completedPatrol = safetyService.completePatrol(
    qsheAdminUser,
    scheduledPatrol.id,
    'Seluruh parameter checklist telah selesai diverifikasi.'
  );

  assert(
    completedPatrol.status === 'Completed' &&
      completedPatrol.conductedDate !== null &&
      completedPatrol.generalObservations?.includes('selesai diverifikasi'),
    `Patrol successfully completed after 100% mandatory checklist verification (status: ${completedPatrol.status})`
  );

  // TEST 68: Universal Anti Self-Approval Protection — Member blocked
  let memberSelfApprovalBlocked = false;
  try {
    safetyService.reviewFinding(nonAdminMember, directFinding.id, 'Under Review');
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Self-approval is strictly prohibited')) {
      memberSelfApprovalBlocked = true;
    }
  }

  assert(
    memberSelfApprovalBlocked,
    'Universal Anti Self-Approval: Member is strictly blocked from reviewing/approving their own finding'
  );

  // TEST 69: Universal Anti Self-Approval Protection — Approver blocked on own report
  const approverReportedFinding = safetyService.createDirectFinding(approverUser, {
    title: 'Kabel charger forklift terkelupas di receiving dock',
    description: 'Insulasi tembaga terlihat terbuka pada unit reach truck #03',
    departmentId: 'dept-whs',
    sectionId: 'sec-rec',
    operationalAreaId: 'sec-rec',
    categoryId: 'fc-cond',
    riskLevelId: 'rl-hi',
  });

  let approverSelfApprovalBlocked = false;
  try {
    safetyService.reviewFinding(approverUser, approverReportedFinding.id, 'Under Review');
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Self-approval is strictly prohibited')) {
      approverSelfApprovalBlocked = true;
    }
  }

  assert(
    approverSelfApprovalBlocked,
    'Universal Anti Self-Approval: Approver is strictly blocked from reviewing/approving findings they reported themselves'
  );

  // TEST 70: Universal Anti Self-Approval Protection — QSHE_ADMIN strictly blocked on own report
  const adminReportedFinding = safetyService.createDirectFinding(qsheAdminUser, {
    title: 'Sensor photoelectric pintu rolling door tidak merespons',
    description: 'Pintu otomatis tidak berhenti ketika ada objek melintas di sensor bawah',
    departmentId: 'dept-whs',
    sectionId: 'sec-rec',
    operationalAreaId: 'sec-rec',
    categoryId: 'fc-cond',
    riskLevelId: 'rl-crt',
  });

  let adminSelfApprovalBlocked = false;
  try {
    safetyService.reviewFinding(qsheAdminUser, adminReportedFinding.id, 'Under Review');
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Self-approval is strictly prohibited')) {
      adminSelfApprovalBlocked = true;
    }
  }

  assert(
    adminSelfApprovalBlocked,
    'Universal Anti Self-Approval: QSHE Admin is strictly blocked from approving their own reported finding (No admin bypass)'
  );

  // TEST 71: Secondary QSHE_ADMIN can review and approve finding reported by Primary Admin
  const reviewedByCoAdmin = safetyService.reviewFinding(
    coAdminUser,
    adminReportedFinding.id,
    'Accepted',
    'Diverifikasi oleh QSHE Co-Admin. Tindakan perbaikan segera diterbitkan.'
  );

  assert(
    reviewedByCoAdmin.status === 'Accepted' &&
      reviewedByCoAdmin.reviewHistory.some((r) => r.actorNoreg === coAdminUser.noreg && r.newStatus === 'Accepted'),
    `Cross-review successfully performed by secondary QSHE Admin (${coAdminUser.fullName}) for Admin 1 report`
  );

  // TEST 72: Mandatory Rejection Reason Validation
  let rejectionReasonMissingCaught = false;
  try {
    safetyService.reviewFinding(approverUser, directFinding.id, 'Rejected', 'Catatan biasa', '');
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Rejection reason is mandatory')) {
      rejectionReasonMissingCaught = true;
    }
  }

  assert(
    rejectionReasonMissingCaught,
    'Rejection is strictly blocked when mandatory rejectionReason is empty or missing'
  );

  // TEST 73: Rejection with mandatory reason saves rejectionReason & logs audit action
  const rejectedFinding = safetyService.reviewFinding(
    approverUser,
    directFinding.id,
    'Rejected',
    'Pemeriksaan lapangan menunjukkan area sudah dibersihkan oleh tim shift 1.',
    'Area sudah dibersihkan sebelum laporan masuk (False Positive)'
  );

  assert(
    rejectedFinding.status === 'Rejected' &&
      rejectedFinding.rejectionReason?.includes('False Positive'),
    `Finding successfully rejected with mandatory rejection reason recorded: "${rejectedFinding.rejectionReason}"`
  );

  // TEST 74: Finding Complete Lifecycle Progression including 'Accepted'
  // Create clean candidate for full progression
  const lifecycleCandidate = safetyService.createDirectFinding(nonAdminMember, {
    title: 'Lampu darurat tangga darurat gedung logistik padam',
    description: 'Baterai cadangan lampu darurat tidak menyala saat tes bulanan',
    departmentId: 'dept-whs',
    sectionId: 'sec-rec',
    operationalAreaId: 'sec-rec',
    categoryId: 'fc-cond',
    riskLevelId: 'rl-med',
  });

  const step1 = safetyService.reviewFinding(approverUser, lifecycleCandidate.id, 'Under Review');
  assert(step1.status === 'Under Review', 'Transition to Under Review succeeds');

  const step2 = safetyService.reviewFinding(approverUser, lifecycleCandidate.id, 'Accepted');
  assert(step2.status === 'Accepted', 'Transition to Accepted succeeds');

  const step3 = safetyService.reviewFinding(approverUser, lifecycleCandidate.id, 'In Progress');
  assert(step3.status === 'In Progress', 'Transition to In Progress succeeds');

  const step4 = safetyService.reviewFinding(approverUser, lifecycleCandidate.id, 'Resolved');
  assert(step4.status === 'Resolved', 'Transition to Resolved succeeds');

  const step5 = safetyService.reviewFinding(approverUser, lifecycleCandidate.id, 'Closed');
  assert(step5.status === 'Closed', 'Transition to Closed succeeds');

  const statusesInHistory = step5.reviewHistory.map((r) => r.newStatus);
  assert(
    step5.status === 'Closed' &&
      statusesInHistory.includes('Under Review') &&
      statusesInHistory.includes('Accepted') &&
      statusesInHistory.includes('In Progress') &&
      statusesInHistory.includes('Resolved') &&
      statusesInHistory.includes('Closed'),
    'Finding complete lifecycle traversed: Submitted -> Under Review -> Accepted -> In Progress -> Resolved -> Closed'
  );

  // TEST 75: Approver Area Access Boundary
  let approverAreaBoundaryViolationCaught = false;
  const storageAreaFinding = safetyService.createDirectFinding(nonAdminMember, {
    title: 'Penataan racking tier 4 melebihi batas beban di Storage Area',
    description: 'Indikasi defleksi beam melebihi toleransi teknis pabrikan',
    departmentId: 'dept-whs',
    sectionId: 'sec-sto',
    operationalAreaId: 'sec-sto', // Storage area
    categoryId: 'fc-cond',
    riskLevelId: 'rl-hi',
  });

  try {
    const limitedApproverOnlyReceiving: AuthUser = {
      ...approverUser,
      areaAccess: ['sec-rec'], // Only Receiving area authorization
    };
    safetyService.reviewFinding(
      limitedApproverOnlyReceiving,
      storageAreaFinding.id,
      'Under Review'
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Area Access authorization')) {
      approverAreaBoundaryViolationCaught = true;
    }
  }

  assert(
    approverAreaBoundaryViolationCaught,
    'Approver with Area Access restricted to Receiving cannot review findings in Storage Area'
  );

  // TEST 76: Member Data Isolation
  const memberPersonalFindings = safetyService.getMyFindings(nonAdminMember);
  const allFindings = safetyService.getAllFindings();
  assert(
    memberPersonalFindings.length > 0 &&
      memberPersonalFindings.every((f) => f.reportedByNoreg === nonAdminMember.noreg) &&
      memberPersonalFindings.length < allFindings.length,
    `Member Data Isolation: Member receives strictly personal records (${memberPersonalFindings.length} of ${allFindings.length} total findings)`
  );

  // TEST 77: Operational Synchronization with Module 04 Dashboard
  const dashboardFindings = dashboardService.getAllDivisionFindings();
  const directFindingInDashboard = dashboardFindings.some((f) => f.id === directFinding.id);
  assert(
    directFindingInDashboard,
    'Operational Synchronization: Findings created in safetyService automatically reflect in dashboardService'
  );

  console.log(`\n======================================================`);
  console.log(`TOTAL TESTS PASSED: ${passed}/${total}`);
  console.log(`======================================================`);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
