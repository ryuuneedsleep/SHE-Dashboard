import React from 'react';
import { X, Check, Copy } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { RoleBadge } from '../common/RoleBadge';
import { DEMO_ACCOUNTS } from '../../data/demoAccounts';

interface DemoAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount?: (email: string, pass: string) => void;
}

export const DemoAccountsModal: React.FC<DemoAccountsModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
}) => {
  const [copiedEmail, setCopiedEmail] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#EB0A1E]" />
              <h3 className="text-base font-bold tracking-tight">
                SPLD SAFETY — Personnel & Role Directory
              </h3>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Module 02 Final Policy: QSHE Admin holds Super Admin privileges.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 leading-relaxed">
            <strong>Security Notice:</strong> In this prototype, passwords are encrypted in-memory and never stored in plain text.
            All demo accounts share the prototype password: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono font-bold">Toyota@2026</code>.
          </div>

          <div className="space-y-3">
            {DEMO_ACCOUNTS.map((acc) => (
              <div
                key={acc.email}
                className="border border-gray-200 rounded-lg p-3.5 hover:border-gray-400 transition-all bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900">
                      {acc.name}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      ({acc.noreg})
                    </span>
                    <RoleBadge role={acc.role} size="sm" />
                    <StatusBadge status={acc.status} size="sm" />
                  </div>
                  <div className="text-xs text-gray-600">
                    {acc.dept} • {acc.pos}
                  </div>
                  <div className="text-xs font-mono text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200 inline-block">
                    {acc.email}
                  </div>
                  <p className="text-[11px] text-gray-500 italic">{acc.desc}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleCopy(acc.email)}
                    className="p-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-white rounded border border-gray-200 transition-colors flex items-center gap-1"
                    title="Copy Email"
                  >
                    {copiedEmail === acc.email ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {onSelectAccount && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectAccount(acc.email, acc.pass);
                        onClose();
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded hover:bg-[#EB0A1E] transition-colors"
                    >
                      Use in Login
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};
