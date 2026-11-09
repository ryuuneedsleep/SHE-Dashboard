import React, { useState } from 'react';
import type {
  MasterRecord,
  MasterDataCategory,
  MasterDataFormData,
  SectionRecord,
  OperationalAreaRecord,
  RiskLevelRecord,
  DepartmentRecord,
} from '../../types/masterData';
import { Button } from '../common/Button';
import { InputField } from '../common/InputField';
import { SelectField } from '../common/SelectField';
import { X, Save, AlertCircle } from 'lucide-react';

interface MasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: MasterDataFormData) => Promise<void>;
  category: MasterDataCategory;
  categoryTitle: string;
  initialData?: MasterRecord | null;
  departmentsList?: DepartmentRecord[];
}

export const MasterDataModal: React.FC<MasterDataModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categoryTitle,
  category,
  initialData,
  departmentsList = [],
}) => {
  const isEditing = Boolean(initialData);

  const [code, setCode] = useState(() => initialData?.code || '');
  const [name, setName] = useState(() => initialData?.name || '');
  const [description, setDescription] = useState(() => initialData?.description || '');
  const [departmentId, setDepartmentId] = useState(() => {
    if (category === 'sections' && initialData) {
      return (initialData as SectionRecord).departmentId || '';
    }
    return departmentsList[0]?.id || '';
  });
  const [location, setLocation] = useState(() => {
    if (category === 'operational_areas' && initialData) {
      return (initialData as OperationalAreaRecord).location || '';
    }
    return '';
  });
  const [displayColor, setDisplayColor] = useState(() => {
    if (category === 'risk_levels' && initialData) {
      return (initialData as RiskLevelRecord).displayColor || '#10B981';
    }
    return '#10B981';
  });
  const [sortOrder, setSortOrder] = useState<number>(() => {
    if (category === 'risk_levels' && initialData) {
      return (initialData as RiskLevelRecord).sortOrder ?? 1;
    }
    return 1;
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Code is required.');
      return;
    }
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (category === 'sections' && !departmentId) {
      setError('Please select a parent department.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: MasterDataFormData = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim(),
      };

      if (category === 'sections') {
        payload.departmentId = departmentId;
      }
      if (category === 'operational_areas') {
        payload.location = location.trim();
      }
      if (category === 'risk_levels') {
        payload.displayColor = displayColor.trim();
        payload.sortOrder = Number(sortOrder) || 1;
      }

      await onSave(payload);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save master record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#EB0A1E]" />
            <h3 className="text-base font-bold">
              {isEditing ? `Edit ${categoryTitle}` : `Add New ${categoryTitle}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Unique Code"
              placeholder="e.g. DEPT-WH, SEC-REC"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              helperText="Must be unique within category"
            />

            <InputField
              label="Name / Label"
              placeholder="e.g. Warehouse Operations"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Category specific inputs */}
          {category === 'sections' && (
            <SelectField
              label="Parent Department"
              options={departmentsList.map((d) => ({
                value: d.id,
                label: `${d.name} (${d.code})`,
              }))}
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
              helperText="Associated organizational department"
            />
          )}

          {category === 'operational_areas' && (
            <InputField
              label="Physical Location / Zone"
              placeholder="e.g. Bay 01-04 (North Gate), Rack A-D"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              helperText="Specific facility zone description"
            />
          )}

          {category === 'risk_levels' && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Display Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={displayColor}
                    onChange={(e) => setDisplayColor(e.target.value)}
                    className="w-9 h-9 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={displayColor}
                    onChange={(e) => setDisplayColor(e.target.value)}
                    className="w-full text-xs font-mono p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <InputField
                label="Rank Sort Order"
                type="number"
                min="1"
                max="10"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                required
                helperText="1 = Lowest, 4 = Critical"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Operational context, scope, or usage instructions..."
              className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
            />
          </div>

          <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {isEditing ? 'Save Changes' : 'Create Record'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

