import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from './BrandLogo.tsx';
import { mockAuthService } from '../../services/mock/mockAuthService.ts';
import { LogOut, User, ShieldAlert } from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = mockAuthService.getCurrentUser();

  const handleLogout = async () => {
    await mockAuthService.logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Demo Mode Banner */}
      <div className="bg-amber-500 text-white text-[11px] py-1 px-4 flex items-center justify-between font-medium">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>DEMO MODE — Authentication belum terhubung ke backend.</span>
          </div>
          <span className="hidden sm:inline text-amber-100 text-[10px]">PWA Tugas Akhir Praktikum</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <BrandLogo />
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
                SPLD <span className="text-red-600">SAFETY</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                K3 Safety Management PWA
              </span>
            </div>
          </div>

          {/* User profile / Logout */}
          {currentUser && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-xs text-slate-700"
              >
                <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="hidden sm:inline font-medium">{currentUser.name}</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Keluar (Logout)"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
