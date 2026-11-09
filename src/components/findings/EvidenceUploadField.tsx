import React, { useState, useRef } from 'react';
import type { FindingEvidence } from '../../types/safety';
import { Camera, Image as ImageIcon, Trash2, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { Button } from '../common/Button';

interface EvidenceUploadFieldProps {
  evidence: FindingEvidence | null;
  onChange: (evidence: FindingEvidence | null) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const EvidenceUploadField: React.FC<EvidenceUploadFieldProps> = ({
  evidence,
  onChange,
  disabled = false,
}) => {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validate File Type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Format file tidak didukung. Harap pilih gambar dengan format JPG, PNG, atau WEBP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Validate File Size (Max 5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`Ukuran file terlalu besar (${(file.size / (1024 * 1024)).toFixed(1)} MB). Batas maksimum adalah 5 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 3. Convert to Base64 Data URL for in-memory prototype preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const previewUrl = event.target?.result as string;
      const newEvidence: FindingEvidence = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        previewUrl,
        uploadedAt: new Date().toISOString(),
      };
      onChange(newEvidence);
    };
    reader.onerror = () => {
      setError('Gagal membaca file gambar. Silakan coba lagi.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setError(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2.5">
      <label className="block text-xs font-semibold text-gray-700">
        Foto Bukti Temuan (Evidence Photo)
        <span className="text-gray-400 font-normal ml-1">(JPG, PNG, WEBP maks. 5MB)</span>
      </label>

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      {/* Upload Dropzone / Empty State */}
      {!evidence ? (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
            disabled
              ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
              : 'border-gray-300 hover:border-[#EB0A1E] hover:bg-red-50/30'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-red-50 text-[#EB0A1E] flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800">
              Klik untuk mengambil atau mengunggah foto bukti
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Dokumentasikan kondisi tidak aman atau tindakan bahaya di lapangan
            </p>
          </div>
        </div>
      ) : (
        /* Preview Card with Meta & Actions */
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
          <div className="flex items-start gap-3">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 bg-white flex-shrink-0 flex items-center justify-center">
              <img
                src={evidence.previewUrl}
                alt={evidence.fileName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 truncate">
                <ImageIcon className="w-3.5 h-3.5 text-[#EB0A1E] flex-shrink-0" />
                <span className="truncate">{evidence.fileName}</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Ukuran: {formatFileSize(evidence.fileSize)} • Format: {evidence.fileType}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  leftIcon={<RefreshCw className="w-3 h-3" />}
                  className="text-xs h-7 px-2.5"
                >
                  Ganti Foto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  disabled={disabled}
                  leftIcon={<Trash2 className="w-3 h-3 text-red-600" />}
                  className="text-xs h-7 px-2.5 text-red-600 border-red-200 hover:bg-red-50"
                >
                  Hapus
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Message */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Prototype Storage Disclosure */}
      <div className="flex items-start gap-1.5 text-[10px] text-gray-500 bg-gray-100/70 p-2 rounded-lg border border-gray-200">
        <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Keterbatasan Prototipe:</strong> Foto bukti disimpan sementara dalam memori sesi (Data URL) untuk simulasi demo. Pada versi produksi, data akan ditransfer ke secure cloud object storage.
        </span>
      </div>
    </div>
  );
};

