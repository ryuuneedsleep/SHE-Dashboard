import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  Search,
  History,
  AlertTriangle,
  MapPin,
  Check,
  X,
  UserCheck,
  Database,
  Download,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { masterDataService } from '../../services/masterDataService';
import { exportUsersToCSV, exportAuditLogsToCSV } from '../../utils/exportUtils';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RoleBadge } from '../../components/common/RoleBadge';
import {
  ROLE_OPTIONS,
  ROLE_CONFIGS,
} from '../../data/masterData';
import type {
  AuthUser,
  RegistrationRequest,
  AppRole,
  AccountStatus,
  AuditLogEntry,
} from '../../types/auth';

export const AdminPortalPage: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState<'approvals' | 'users' | 'audit'>('approvals');

  // Local data state refreshed after operations
  const [users, setUsers] = useState<AuthUser[]>(authService.getAllUsers());
  const [pendingRequests, setPendingRequests] = useState<RegistrationRequest[]>(
    authService.getPendingRegistrations()
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(authService.getAuditLogs());
  const operationalAreasList = masterDataService.getActiveOperationalAreas();

  // Global alerts/notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Approval Modal State
  const [selectedReg, setSelectedReg] = useState<RegistrationRequest | null>(null);
  const [assignedRole, setAssignedRole] = useState<AppRole>('MEMBER');
  const [assignedAreas, setAssignedAreas] = useState<string[]>([]);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Rejection Modal State
  const [rejectionTarget, setRejectionTarget] = useState<RegistrationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessingRejection, setIsProcessingRejection] = useState(false);

  // Edit Role Modal State
  const [roleEditUser, setRoleEditUser] = useState<AuthUser | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<AppRole>('MEMBER');
  const [roleChangeConfirm, setRoleChangeConfirm] = useState(false);
  const [isProcessingRole, setIsProcessingRole] = useState(false);

  // Edit Area Access Modal State
  const [areaEditUser, setAreaEditUser] = useState<AuthUser | null>(null);
  const [selectedAreaAccess, setSelectedAreaAccess] = useState<string[]>([]);
  const [isProcessingArea, setIsProcessingArea] = useState(false);

  // User list filters
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [areaFilter, setAreaFilter] = useState<string>('ALL');

  const refreshAllData = () => {
    setUsers(authService.getAllUsers());
    setPendingRequests(authService.getPendingRegistrations());
    setAuditLogs(authService.getAuditLogs());
  };

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setActionError(null);
    setTimeout(() => setActionSuccess(null), 5000);
  };

  const showError = (msg: string) => {
    setActionError(msg);
    setActionSuccess(null);
    setTimeout(() => setActionError(null), 6000);
  };

  // -------------------------------------------------------------------------
  // Handlers: Approval & Rejection
  // -------------------------------------------------------------------------
  const openApprovalModal = (reg: RegistrationRequest) => {
    setSelectedReg(reg);
    setAssignedRole('MEMBER');
    // Pre-populate with matching area if found
    const matchingArea = operationalAreasList.find(
      (a) => a.name.toLowerCase() === reg.section.toLowerCase()
    );
    setAssignedAreas(matchingArea ? [matchingArea.id] : []);
  };

  const handleApprove = async () => {
    if (!currentUser || !selectedReg) return;
    setIsProcessingApproval(true);

    try {
      await authService.approveRegistration(
        currentUser,
        selectedReg.registrationId,
        assignedRole,
        assignedAreas
      );
      showSuccess(
        `Registration for ${selectedReg.fullName} (${selectedReg.noreg}) has been approved. Assigned role: ${ROLE_CONFIGS[assignedRole].label}.`
      );
      setSelectedReg(null);
      refreshAllData();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to approve registration.');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleReject = async () => {
    if (!currentUser || !rejectionTarget) return;
    if (!rejectionReason.trim()) {
      showError('Please provide a mandatory rejection reason.');
      return;
    }
    setIsProcessingRejection(true);

    try {
      await authService.rejectRegistration(
        currentUser,
        rejectionTarget.registrationId,
        rejectionReason
      );
      showSuccess(
        `Registration for ${rejectionTarget.fullName} (${rejectionTarget.noreg}) has been rejected.`
      );
      setRejectionTarget(null);
      setRejectionReason('');
      refreshAllData();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to reject registration.');
    } finally {
      setIsProcessingRejection(false);
    }
  };

  // -------------------------------------------------------------------------
  // Handlers: Role Change
  // -------------------------------------------------------------------------
  const openRoleEdit = (user: AuthUser) => {
    setRoleEditUser(user);
    setNewSelectedRole(user.role);
    setRoleChangeConfirm(false);
  };

  const handleRoleUpdate = async () => {
    if (!currentUser || !roleEditUser) return;
    setIsProcessingRole(true);

    try {
      await authService.updateUserRole(currentUser, roleEditUser.id, newSelectedRole);
      showSuccess(
        `Role for ${roleEditUser.fullName} updated to ${ROLE_CONFIGS[newSelectedRole].label}.`
      );
      setRoleEditUser(null);
      refreshAllData();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Role update blocked.');
    } finally {
      setIsProcessingRole(false);
    }
  };

  // -------------------------------------------------------------------------
  // Handlers: Area Access Management
  // -------------------------------------------------------------------------
  const openAreaEdit = (user: AuthUser) => {
    setAreaEditUser(user);
    setSelectedAreaAccess([...user.areaAccess]);
  };

  const toggleArea = (areaId: string) => {
    setSelectedAreaAccess((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]
    );
  };

  const handleAreaUpdate = async () => {
    if (!currentUser || !areaEditUser) return;
    setIsProcessingArea(true);

    try {
      await authService.updateUserAreaAccess(
        currentUser,
        areaEditUser.id,
        selectedAreaAccess
      );
      showSuccess(
        `Operational area access for ${areaEditUser.fullName} updated (${selectedAreaAccess.length} areas assigned).`
      );
      setAreaEditUser(null);
      refreshAllData();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Area access update failed.');
    } finally {
      setIsProcessingArea(false);
    }
  };

  // -------------------------------------------------------------------------
  // Handlers: Status Change
  // -------------------------------------------------------------------------
  const handleStatusChange = async (user: AuthUser, newStatus: AccountStatus) => {
    if (!currentUser) return;
    try {
      await authService.updateUserStatus(currentUser, user.id, newStatus);
      showSuccess(`Account status for ${user.fullName} updated to ${newStatus}.`);
      refreshAllData();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Status change failed.');
    }
  };

  // -------------------------------------------------------------------------
  // Filtering Users
  // -------------------------------------------------------------------------
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.noreg.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    const matchesArea =
      areaFilter === 'ALL' || (u.areaAccess && u.areaAccess.includes(areaFilter));

    return matchesSearch && matchesRole && matchesStatus && matchesArea;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-gray-900 text-white rounded-xl p-6 shadow-sm border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EB0A1E] animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                QSHE Admin Portal — User Management & Access Control
              </h1>
            </div>
            <p className="text-xs text-gray-300">
              Module 02 Policy: QSHE Admin holds Super Admin privileges. Governs role
              assignments, multiple operational area access, and registration approvals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/admin/master-data">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-gray-700 hover:bg-white/20"
                leftIcon={<Database className="w-3.5 h-3.5 text-red-400" />}
              >
                Master Data Hub
              </Button>
            </Link>

            <div className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-right">
              <div className="text-[10px] text-gray-400">Current Administrator</div>
              <div className="font-bold text-white flex items-center gap-1.5 justify-end">
                <span>{currentUser?.fullName}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {actionSuccess && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="font-medium">{actionSuccess}</div>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="font-medium">{actionError}</div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-xs flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'approvals'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Pending Registration Approvals</span>
            {pendingRequests.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-[#EB0A1E] text-white text-[10px] font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'users'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Directory & Area Access</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 text-[10px]">
              {users.length}
            </span>
          </button>

          <Link
            to="/admin/master-data"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Database className="w-4 h-4 text-[#EB0A1E]" />
            <span>Master Data Hub</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-100 text-[#EB0A1E] text-[10px] font-bold">
              10
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'audit'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Administrative Audit History</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 text-[10px]">
              {auditLogs.length}
            </span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: PENDING REGISTRATION APPROVALS */}
        {/* =================================================================== */}
        {activeTab === 'approvals' && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Registration Approval Queue
                </h2>
                <p className="text-xs text-gray-500">
                  Only QSHE Admin can approve or reject registration requests. Before
                  approval, assign the final role and operational area access.
                </p>
              </div>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="text-sm font-bold text-gray-900">Queue Clear</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  There are currently no registration requests pending QSHE Admin approval.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider border-y border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Applicant</th>
                      <th className="px-4 py-3">Noreg</th>
                      <th className="px-4 py-3">Department & Section</th>
                      <th className="px-4 py-3">Reported Position</th>
                      <th className="px-4 py-3">Submission Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingRequests.map((req) => (
                      <tr key={req.registrationId} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          <div>{req.fullName}</div>
                          <div className="text-[11px] text-gray-500 font-mono">
                            {req.email}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-700">
                          {req.noreg}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {req.department}
                          </div>
                          <div className="text-[11px] text-gray-500">{req.section}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{req.position}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-[11px]">
                          {new Date(req.registrationDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-700 border-red-200 hover:bg-red-50"
                            onClick={() => setRejectionTarget(req)}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openApprovalModal(req)}
                          >
                            Review & Approve
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: USER DIRECTORY & ACCESS CONTROL */}
        {/* =================================================================== */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden space-y-4 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  SPLD Personnel Directory & Area Access Governance
                </h2>
                <p className="text-xs text-gray-500">
                  Assign application roles and configure multiple operational area access.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => exportUsersToCSV(filteredUsers, 'SPLD_User_Directory')}
                leftIcon={<Download className="w-3.5 h-3.5 text-gray-700" />}
              >
                Export User Directory (.CSV)
              </Button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-lg border border-gray-200 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name, noreg, or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
                />
              </div>

              <div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
                >
                  <option value="ALL">All Roles</option>
                  <option value="QSHE_ADMIN">QSHE Admin</option>
                  <option value="APPROVER">Approver / Leader</option>
                  <option value="MEMBER">Member / Reporter</option>
                  <option value="MANAGEMENT">Management</option>
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
                >
                  <option value="ALL">All Area Access</option>
                  {operationalAreasList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider border-y border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Personnel</th>
                    <th className="px-4 py-3">Department & Pos</th>
                    <th className="px-4 py-3">Application Role</th>
                    <th className="px-4 py-3">Operational Area Access</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((u) => {
                    const isSelf = currentUser?.id === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          <div className="flex items-center gap-1.5">
                            <span>{u.fullName}</span>
                            {isSelf && (
                              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono">
                            {u.noreg} • {u.email}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{u.department}</div>
                          <div className="text-[11px] text-gray-500">{u.position}</div>
                        </td>

                        <td className="px-4 py-3">
                          <RoleBadge role={u.role} size="sm" />
                        </td>

                        <td className="px-4 py-3 max-w-xs">
                          {u.areaAccess && u.areaAccess.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {u.areaAccess.map((aid) => {
                                const areaObj = operationalAreasList.find((a) => a.id === aid);
                                return (
                                  <span
                                    key={aid}
                                    className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] border border-slate-200 truncate max-w-[150px]"
                                    title={areaObj?.name || aid}
                                  >
                                    {areaObj?.name.split('&')[0].trim() || aid}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-[11px] text-red-600 font-medium italic">
                              No areas assigned (Locked)
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={u.status} size="sm" />
                        </td>

                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                          {/* Role edit */}
                          <button
                            type="button"
                            onClick={() => openRoleEdit(u)}
                            disabled={isSelf}
                            className={`p-1.5 rounded border text-[11px] font-medium transition-colors ${
                              isSelf
                                ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
                            }`}
                            title={
                              isSelf
                                ? 'Users cannot change their own role'
                                : 'Change User Role'
                            }
                          >
                            Edit Role
                          </button>

                          {/* Area access edit */}
                          <button
                            type="button"
                            onClick={() => openAreaEdit(u)}
                            className="p-1.5 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:border-gray-400 text-[11px] font-medium transition-colors"
                            title="Manage Area Access"
                          >
                            Areas ({u.areaAccess?.length || 0})
                          </button>

                          {/* Status quick toggle */}
                          {u.status === 'Active' ? (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(u, 'Suspended')}
                              disabled={isSelf}
                              className={`p-1.5 rounded border text-[11px] font-medium transition-colors ${
                                isSelf
                                  ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                                  : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                              }`}
                              title="Suspend account"
                            >
                              Suspend
                            </button>
                          ) : u.status === 'Suspended' ? (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(u, 'Active')}
                              className="p-1.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-medium transition-colors"
                              title="Reactivate account"
                            >
                              Activate
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: AUDIT HISTORY */}
        {/* =================================================================== */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden space-y-4 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Administrative Audit History
                </h2>
                <p className="text-xs text-gray-500">
                  Immutable record of registration approvals, role changes, area access updates,
                  and administrator privilege adjustments.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => exportAuditLogsToCSV(auditLogs, 'SPLD_Audit_Trail')}
                leftIcon={<Download className="w-3.5 h-3.5 text-gray-700" />}
              >
                Export Audit (.CSV)
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider border-y border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Administrator (Actor)</th>
                    <th className="px-4 py-3">Action Type</th>
                    <th className="px-4 py-3">Target User</th>
                    <th className="px-4 py-3">Audit Details & Value Changes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-gray-900 font-sans font-semibold">
                        <div>{log.actorName}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {log.actorNoreg} • {log.actorRole}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                            log.action === 'REGISTRATION_APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : log.action === 'REGISTRATION_REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : log.action === 'ADMIN_PRIVILEGE_CHANGED'
                              ? 'bg-red-50 text-red-700 border-red-300'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-900 font-sans">
                        <div className="font-semibold">{log.targetUserName}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {log.targetUserNoreg}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-sans text-gray-700 max-w-md">
                        <div>{log.details}</div>
                        {(log.previousValue !== undefined || log.newValue !== undefined) && (
                          <div className="text-[10px] text-gray-500 mt-0.5 font-mono">
                            Prev: {JSON.stringify(log.previousValue)} → New:{' '}
                            {JSON.stringify(log.newValue)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: REGISTRATION APPROVAL & AREA ASSIGNMENT */}
      {/* ===================================================================== */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EB0A1E]" />
                <h3 className="text-base font-bold">Approve Registration Request</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReg(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* Applicant Info */}
              <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-200 space-y-1">
                <div className="font-bold text-sm text-gray-900">
                  {selectedReg.fullName}
                </div>
                <div className="text-gray-600">
                  Noreg: <span className="font-mono font-bold">{selectedReg.noreg}</span> •{' '}
                  {selectedReg.email}
                </div>
                <div className="text-gray-600">
                  Department: <span className="font-semibold">{selectedReg.department}</span>{' '}
                  • Section: <span className="font-semibold">{selectedReg.section}</span> •{' '}
                  Position: <span className="font-semibold">{selectedReg.position}</span>
                </div>
              </div>

              {/* Step 1: Assign Role */}
              <div className="space-y-2">
                <label className="block font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                  1. Assign Final Application Role (Required)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                        assignedRole === opt.value
                          ? 'border-[#EB0A1E] bg-red-50/50 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900">{opt.label}</span>
                        <input
                          type="radio"
                          name="assignedRole"
                          value={opt.value}
                          checked={assignedRole === opt.value}
                          onChange={() => setAssignedRole(opt.value)}
                          className="text-[#EB0A1E] focus:ring-[#EB0A1E]"
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 leading-tight">
                        {opt.description}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step 2: Assign Multiple Operational Areas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                    2. Assign Multiple Operational Areas ({assignedAreas.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setAssignedAreas(
                        assignedAreas.length === operationalAreasList.length
                          ? []
                          : operationalAreasList.map((a) => a.id)
                      )
                    }
                    className="text-[11px] text-[#EB0A1E] hover:underline font-semibold"
                  >
                    {assignedAreas.length === operationalAreasList.length
                      ? 'Deselect All'
                      : 'Select All Areas'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50/50">
                  {operationalAreasList.map((area) => {
                    const isChecked = assignedAreas.includes(area.id);
                    return (
                      <label
                        key={area.id}
                        className={`p-2 rounded border cursor-pointer text-[11px] flex items-center gap-2 transition-colors ${
                          isChecked
                            ? 'bg-red-50 border-red-300 text-gray-900 font-semibold'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            setAssignedAreas((prev) =>
                              prev.includes(area.id)
                                ? prev.filter((id) => id !== area.id)
                                : [...prev, area.id]
                            )
                          }
                          className="rounded text-[#EB0A1E] focus:ring-[#EB0A1E] h-4 w-4"
                        />
                        <span className="truncate">{area.name}</span>
                      </label>
                    );
                  })}
                </div>
                {assignedAreas.length === 0 && (
                  <p className="text-[11px] text-amber-700">
                    ⚠️ Notice: An empty Area Access assignment does not grant access to any
                    operational safety tools.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReg(null)}
                disabled={isProcessingApproval}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                isLoading={isProcessingApproval}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Confirm & Activate Account
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: REGISTRATION REJECTION WITH REASON */}
      {/* ===================================================================== */}
      {rejectionTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-300" />
                <h3 className="text-base font-bold">Reject Registration</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectionTarget(null)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-gray-700">
                You are rejecting the registration request for{' '}
                <strong>{rejectionTarget.fullName}</strong> ({rejectionTarget.noreg}).
              </p>

              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  Rejection Reason (Mandatory)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Employee Number not verified in HR database, or invalid section assignment."
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 text-xs"
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectionTarget(null)}
                disabled={isProcessingRejection}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleReject}
                isLoading={isProcessingRejection}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: EDIT ROLE WITH SAFETY CONFIRMATION */}
      {/* ===================================================================== */}
      {roleEditUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold">Modify Application Role</h3>
              </div>
              <button
                type="button"
                onClick={() => setRoleEditUser(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                Target: <strong>{roleEditUser.fullName}</strong> ({roleEditUser.noreg})
                <div className="text-gray-500 mt-0.5">
                  Current Role: <RoleBadge role={roleEditUser.role} size="sm" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-gray-800">
                  Select New Application Role:
                </label>
                <div className="space-y-1.5">
                  {ROLE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`p-2.5 rounded border block cursor-pointer transition-colors ${
                        newSelectedRole === opt.value
                          ? 'border-gray-900 bg-gray-50 font-bold'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{opt.label}</span>
                        <input
                          type="radio"
                          name="newRole"
                          value={opt.value}
                          checked={newSelectedRole === opt.value}
                          onChange={() => setNewSelectedRole(opt.value)}
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Administrator Safety Notice */}
              {roleEditUser.role === 'QSHE_ADMIN' && newSelectedRole !== 'QSHE_ADMIN' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Administrator Privilege Revocation Warning</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    You are revoking Super Admin-level privileges from this user. The system
                    will strictly block this change if this is the last active QSHE Admin account.
                  </p>
                  <label className="flex items-center gap-2 pt-1 font-bold">
                    <input
                      type="checkbox"
                      checked={roleChangeConfirm}
                      onChange={(e) => setRoleChangeConfirm(e.target.checked)}
                      className="rounded text-red-600"
                    />
                    <span>I confirm this administrative privilege change</span>
                  </label>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoleEditUser(null)}
                disabled={isProcessingRole}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRoleUpdate}
                isLoading={isProcessingRole}
                disabled={
                  roleEditUser.role === 'QSHE_ADMIN' &&
                  newSelectedRole !== 'QSHE_ADMIN' &&
                  !roleChangeConfirm
                }
              >
                Save Role
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: EDIT MULTIPLE OPERATIONAL AREA ACCESS */}
      {/* ===================================================================== */}
      {areaEditUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold">Manage Operational Area Access</h3>
              </div>
              <button
                type="button"
                onClick={() => setAreaEditUser(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div>
                User: <strong>{areaEditUser.fullName}</strong> ({areaEditUser.noreg})
                <div className="text-gray-500">
                  Role: <RoleBadge role={areaEditUser.role} size="sm" />
                </div>
              </div>

              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-gray-800">
                  Operational Areas ({selectedAreaAccess.length} Assigned)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedAreaAccess(
                      selectedAreaAccess.length === operationalAreasList.length
                        ? []
                        : operationalAreasList.map((a) => a.id)
                    )
                  }
                  className="text-red-600 font-bold hover:underline"
                >
                  {selectedAreaAccess.length === operationalAreasList.length
                    ? 'Clear All'
                    : 'Assign All'}
                </button>
              </div>

              <div className="space-y-1.5">
                {operationalAreasList.map((area) => {
                  const isChecked = selectedAreaAccess.includes(area.id);
                  return (
                    <label
                      key={area.id}
                      className={`p-2.5 rounded border flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-red-50 border-red-300 font-semibold'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-gray-900">{area.name}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleArea(area.id)}
                        className="rounded text-[#EB0A1E] focus:ring-[#EB0A1E] h-4 w-4"
                      />
                    </label>
                  );
                })}
              </div>

              {selectedAreaAccess.length === 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900">
                  Notice: User has 0 assigned areas. Empty area access will lock access to
                  operational safety modules.
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAreaEditUser(null)}
                disabled={isProcessingArea}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAreaUpdate}
                isLoading={isProcessingArea}
              >
                Save Area Access
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
