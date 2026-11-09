import React from 'react';
import { PhoneCall, Mail } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 text-xs border-t border-gray-800">
      {/* Red accent strip */}
      <div className="h-1 bg-[#EB0A1E] w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Division & Branding */}
          <div className="space-y-3 md:col-span-1">
            <BrandLogo size="sm" inverted={true} />
            <p className="text-gray-400 text-xs leading-relaxed">
              Service Parts Logistic Division (SPLD) Safety Management System.
              Dedicated to continuous Kaizen, 5S standards, and accident-free logistics operations.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>PWA Offline Ready</span>
            </div>
          </div>

          {/* Column 2: Safety Pillars */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold uppercase tracking-wider text-xs">
              Safety Pillars
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li className="hover:text-white transition-colors flex items-center gap-1.5">
                <span className="w-1 h-1 bg-[#EB0A1E] rounded-full" />
                Near-Miss & Hazard Reporting
              </li>
              <li className="hover:text-white transition-colors flex items-center gap-1.5">
                <span className="w-1 h-1 bg-[#EB0A1E] rounded-full" />
                QSHE Standard Operating Procedures
              </li>
              <li className="hover:text-white transition-colors flex items-center gap-1.5">
                <span className="w-1 h-1 bg-[#EB0A1E] rounded-full" />
                Ergonomics & 5S Auditing
              </li>
              <li className="hover:text-white transition-colors flex items-center gap-1.5">
                <span className="w-1 h-1 bg-[#EB0A1E] rounded-full" />
                Jiritsuka & Autonomous Kaizen
              </li>
            </ul>
          </div>

          {/* Column 3: Emergency & QSHE Contact */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold uppercase tracking-wider text-xs">
              QSHE Safety Committee
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-gray-300">
                <PhoneCall className="w-3.5 h-3.5 text-[#EB0A1E]" />
                <span>Internal Safety Hotline: Ext. 4420 / 4421</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="w-3.5 h-3.5 text-[#EB0A1E]" />
                <span>qshe.spld@toyota.co.id</span>
              </div>
              <div className="text-gray-500 text-[11px]">
                Warehouse Center, Service Parts Logistics Division
              </div>
            </div>
          </div>

          {/* Column 4: Architecture & Security */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold uppercase tracking-wider text-xs">
              Module 01: Authentication
            </h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Strict access governance. Role assignment managed by QSHE Administrators in Module 02.
              Enterprise SSO prepared for Microsoft Entra ID.
            </p>
            <div className="inline-block px-2.5 py-1 rounded bg-gray-800 border border-gray-700 text-[10px] text-gray-300 font-mono">
              TAM SPLD • v1.0.0-PROTOTYPE
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
          <div>
            © {new Date().getFullYear()} Service Parts Logistic Division (SPLD). All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-gray-400">Toyota Production System (TPS) Alignment</span>
            <span>•</span>
            <span className="hover:text-gray-400">Zero Accident Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
