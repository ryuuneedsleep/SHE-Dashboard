import React, { useState, useRef, useEffect } from 'react';
import type { FindingEvidence } from '../../types/finding.ts';
import { Camera, Trash2, RefreshCw, AlertCircle, Info } from 'lucide-react';

interface EvidenceUploadFieldProps {
  evidences: FindingEvidence[];
  onChange: (evidences: FindingEvidence[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const EvidenceUploadField: React.FC<EvidenceUploadFieldProps> = ({
  evidences,
  onChange,
  disabled = false,
  maxFiles = 3,
}) => {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);

  // Track created object URLs for proper memory cleanup
  const createdUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const urls = createdUrlsRef.current;
    return () => {
      // Cleanup all object URLs created by this component on unmount
      for (const url of urls) {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      }
      urls.clear();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Format file tidak didukung. Harap pilih gambar dengan format JPG, PNG, atau WEBP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`Ukuran file terlalu besar (${formatBytes(file.size)}). Batas maksimum per foto adalah 5 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    createdUrlsRef.current.add(objectUrl);

    const newEvidence: FindingEvidence = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      url: objectUrl,
      uploadedAt: new Date().toISOString(),
    };

    if (replaceIndexRef.current !== null) {
      // Replace existing item
      const idx = replaceIndexRef.current;
      replaceIndexRef.current = null;
      const oldItem = evidences[idx];
      if (oldItem && oldItem.url.startsWith('blob:')) {
        URL.revokeObjectURL(oldItem.url);
        createdUrlsRef.current.delete(oldItem.url);
      }
      const updated = [...evidences];
      updated[idx] = newEvidence;
      onChange(updated);
    } else {
      // Add new item
      if (evidences.length >= maxFiles) {
        setError(`Maksimal ${maxFiles} foto per laporan.`);
        if (objectUrl.startsWith('blob:')) {
          URL.revokeObjectURL(objectUrl);
          createdUrlsRef.current.delete(objectUrl);
        }
        return;
      }
      onChange([...evidences, newEvidence]);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (index: number) => {
    setError(null);
    const item = evidences[index];
    if (item && item.url.startsWith('blob:')) {
      URL.revokeObjectURL(item.url);
      createdUrlsRef.current.delete(item.url);
    }
    const updated = evidences.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const triggerReplace = (index: number) => {
    replaceIndexRef.current = index;
    fileInputRef.current?.click();
  };

  const triggerAdd = () => {
    replaceIndexRef.current = null;
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
          Dokumentasi Bukti / Foto Temuan ({evidences.length}/{maxFiles})
        </label>
        <span className="text-[11px] text-slate-500 font-medium">Maks. 5 MB / foto (JPG, PNG, WebP)</span>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Gallery / List of Evidences */}
      {evidences.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {evidences.map((item, index) => (
            <div
              key={item.id || index}
              className="relative group bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm"
            >
              <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                <img
                  src={item.url}
                  alt={item.fileName}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                  }}
                />
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                  {!disabled && (
                    <>
                      <button
                        type="button"
                        onClick={() => triggerReplace(index)}
                        className="p-1 rounded-md bg-white/90 text-slate-700 hover:text-blue-600 hover:bg-white shadow transition"
                        title="Ganti foto"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(index)}
                        className="p-1 rounded-md bg-white/90 text-slate-700 hover:text-red-600 hover:bg-white shadow transition"
                        title="Hapus foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="p-2 text-xs">
                <p className="font-medium text-slate-800 truncate" title={item.fileName}>
                  {item.fileName}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {formatBytes(item.fileSize)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Button if less than maxFiles */}
      {!disabled && evidences.length < maxFiles && (
        <button
          type="button"
          onClick={triggerAdd}
          className="w-full border-2 border-dashed border-slate-300 hover:border-red-400 bg-slate-50 hover:bg-red-50/30 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-white group-hover:bg-red-100 flex items-center justify-center text-slate-400 group-hover:text-red-600 shadow-sm transition">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700 group-hover:text-red-600">
            {evidences.length === 0 ? 'Ambil atau Pilih Foto Bukti' : 'Tambah Foto Bukti Lainnya'}
          </span>
          <span className="text-[11px] text-slate-500">
            Format: JPG, PNG, atau WEBP (Maksimal {maxFiles} foto)
          </span>
        </button>
      )}

      {/* Prototype Disclosure Notice */}
      <div className="flex items-start gap-2 p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-lg text-slate-600 text-[11px] leading-relaxed">
        <Info className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
        <span>
          <strong>Demo Mode:</strong> Foto hanya ditampilkan sementara di memori browser dan belum terhubung ke cloud storage.
        </span>
      </div>
    </div>
  );
};
