import React from 'react';
import type {
  MasterRecord,
  MasterDataCategory,
  InUseCheckResult,
} from '../../types/masterData';
import { Button } from '../common/Button';
import { AlertTriangle, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface MasterDataDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  record: MasterRecord | null;
  category: MasterDataCategory;
  categoryTitle: string;
  inUseResult: InUseCheckResult;
  isProcessing: boolean;
}

export const MasterDataDeleteModal: React.FC<MasterDataDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  record,
  categoryTitle,
  inUseResult,
  isProcessing,
}) => {
  if (!isOpen || !record) return null;

  const isDeactivating = record.status === 'Active';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between text-white ${
            isDeactivating
              ? inUseResult.canDeactivate
                ? 'bg-amber-600'
                : 'bg-red-700'
              : 'bg-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {isDeactivating ? (
              <AlertTriangle className="w-5 h-5 text-white" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
            <h3 className="text-base font-bold">
              {isDeactivating
                ? `Deactivate ${categoryTitle}`
                : `Reactivate ${categoryTitle}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-gray-700">
            You are changing the status of{' '}
            <strong className="text-gray-900">{record.name}</strong> (
            <span className="font-mono font-bold">{record.code}</span>) to{' '}
            <strong className={isDeactivating ? 'text-red-700' : 'text-emerald-700'}>
              {isDeactivating ? 'Inactive' : 'Active'}
            </strong>
            .
          </p>

          {/* If Deactivation Blocked */}
          {isDeactivating && !inUseResult.canDeactivate && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Deactivation Blocked</div>
                <p className="mt-0.5 leading-relaxed">{inUseResult.reason}</p>
              </div>
            </div>
          )}

          {/* If In-Use Warning (Allowed to Deactivate with Notice) */}
          {isDeactivating && inUseResult.canDeactivate && inUseResult.isInUse && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Referential Integrity Notice</div>
                <p className="mt-0.5 leading-relaxed">{inUseResult.reason}</p>
              </div>
            </div>
          )}

          {/* Guidance */}
          {isDeactivating ? (
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Deactivated records are strictly excluded from selection in new forms, while
              historical transaction and employee records retain their saved references.
            </p>
          ) : (
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Re-activating this record will immediately restore its availability for new
              selection throughout the application.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>

          {isDeactivating ? (
            <Button
              variant="danger"
              size="sm"
              onClick={onConfirm}
              isLoading={isProcessing}
              disabled={!inUseResult.canDeactivate}
            >
              Confirm Deactivation
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onConfirm}
              isLoading={isProcessing}
            >
              Confirm Reactivation
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

