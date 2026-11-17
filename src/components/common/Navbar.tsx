import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.ts';
import { LogOut, User } from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Typography Header */}
          <div
            className="flex flex-col cursor-pointer select-none"
            onClick={() => navigate('/dashboard')}
          >
            <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none">
              SPLD <span className="text-[#EB0A1E]">SAFETY</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide mt-0.5">
              Safety Management System
            </span>
          </div>

          {/* User profile / Logout */}
          {user && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-xs text-slate-700"
              >
                <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="hidden sm:inline font-medium">
                  {user.fullName || user.name || user.email}
                </span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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

export default Navbar;
