import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MasterDataCategoryTabs } from '../../components/master-data/MasterDataCategoryTabs';
import { CATEGORIES_META } from '../../data/masterDataCategoriesMeta';
import { MasterDataTable } from '../../components/master-data/MasterDataTable';
import { MasterDataModal } from '../../components/master-data/MasterDataModal';
import { MasterDataDeleteModal } from '../../components/master-data/MasterDataDeleteModal';
import { masterDataService } from '../../services/masterDataService';
import { authService } from '../../services/authService';
import type {
  MasterDataCategory,
  MasterRecord,
  MasterDataFormData,
  InUseCheckResult,
} from '../../types/masterData';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Database,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const MasterDataPage: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  const [activeCategory, setActiveCategory] = useState<MasterDataCategory>('departments');

  // Notification banners
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<MasterRecord | null>(null);

  // Deactivate modal state
  const [deleteModalRecord, setDeleteModalRecord] = useState<MasterRecord | null>(null);
  const [inUseResult, setInUseResult] = useState<InUseCheckResult>({
    isInUse: false,
    canDeactivate: true,
    referenceCount: 0,
  });
  const [isProcessingToggle, setIsProcessingToggle] = useState(false);

  // Trigger state refresh
  const [, setRefreshTicker] = useState(0);
  const triggerRefresh = () => setRefreshTicker((t) => t + 1);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    setTimeout(() => setErrorMsg(null), 6000);
  };

  // Active Category Meta
  const currentMeta =
    CATEGORIES_META.find((c) => c.key === activeCategory) || CATEGORIES_META[0];

  // Data for active category
  const activeData = masterDataService.getAll(activeCategory);

  // Category counts
  const categoryCounts = CATEGORIES_META.reduce((acc, cat) => {
    acc[cat.key] = masterDataService.getAll(cat.key).length;
    return acc;
  }, {} as Record<MasterDataCategory, number>);

  // Departments list for sections parent dropdown
  const departmentsList = masterDataService.getActiveDepartments();

  // Handlers
  const handleOpenAdd = () => {
    setModalInitialData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: MasterRecord) => {
    setModalInitialData(record);
    setIsModalOpen(true);
  };

  const handleSaveRecord = async (formData: MasterDataFormData) => {
    if (!currentUser) return;

    if (modalInitialData) {
      // Edit existing
      masterDataService.updateRecord(
        currentUser,
        activeCategory,
        modalInitialData.id,
        formData
      );
      showSuccess(`Record "${formData.name}" successfully updated.`);
    } else {
      // Create new
      masterDataService.createRecord(currentUser, activeCategory, formData);
      showSuccess(`New record "${formData.name}" successfully created.`);
    }
    triggerRefresh();
  };

  const handleOpenToggle = (record: MasterRecord) => {
    const check = masterDataService.checkInUse(activeCategory, record.id);
    setInUseResult(check);
    setDeleteModalRecord(record);
  };

  const handleConfirmToggle = async () => {
    if (!currentUser || !deleteModalRecord) return;
    setIsProcessingToggle(true);

    const newStatus =
      deleteModalRecord.status === 'Active' ? 'Inactive' : 'Active';

    try {
      masterDataService.toggleStatus(
        currentUser,
        activeCategory,
        deleteModalRecord.id,
        newStatus
      );
      showSuccess(
        `Record "${deleteModalRecord.name}" status changed to ${newStatus}.`
      );
      setDeleteModalRecord(null);
      triggerRefresh();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Operation blocked.');
    } finally {
      setIsProcessingToggle(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Banner */}
        <div className="bg-gray-900 text-white rounded-xl p-6 shadow-sm border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EB0A1E] animate-pulse" />
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-red-500" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Master Data Management
                </h1>
              </div>
            </div>
            <p className="text-xs text-gray-300">
              Module 03 Single Source of Truth: Centralized management of 4 Organizational
              and 6 Safety master reference categories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-gray-700 hover:bg-white/20"
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back to User Portal
              </Button>
            </Link>

            <div className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-right hidden sm:block">
              <div className="text-[10px] text-gray-400">Governance Role</div>
              <div className="font-bold text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>QSHE Super Admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="font-medium">{successMsg}</div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Category Navigation Tabs */}
        <MasterDataCategoryTabs
          activeCategory={activeCategory}
          onSelectCategory={(cat) => setActiveCategory(cat)}
          counts={categoryCounts}
        />

        {/* Active Category Table View */}
        <MasterDataTable
          category={activeCategory}
          categoryTitle={currentMeta.title}
          categorySubtitle={currentMeta.subtitle}
          data={activeData}
          onAddNew={handleOpenAdd}
          onEdit={handleOpenEdit}
          onToggleStatus={handleOpenToggle}
          departmentFilterOptions={
            activeCategory === 'sections'
              ? departmentsList.map((d) => ({ id: d.id, name: d.name }))
              : undefined
          }
        />
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <MasterDataModal
          key={modalInitialData ? modalInitialData.id : `new-${activeCategory}`}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalInitialData(null);
          }}
          onSave={handleSaveRecord}
          category={activeCategory}
          categoryTitle={currentMeta.title}
          initialData={modalInitialData}
          departmentsList={departmentsList}
        />
      )}

      {/* Deactivate / Reactivate Confirmation Modal with In-Use Checks */}
      <MasterDataDeleteModal
        isOpen={Boolean(deleteModalRecord)}
        onClose={() => setDeleteModalRecord(null)}
        onConfirm={handleConfirmToggle}
        record={deleteModalRecord}
        category={activeCategory}
        categoryTitle={currentMeta.title}
        inUseResult={inUseResult}
        isProcessing={isProcessingToggle}
      />
    </div>
  );
};
