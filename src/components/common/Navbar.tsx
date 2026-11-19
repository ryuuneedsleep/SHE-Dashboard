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
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB]">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Typography Header */}
          <div
            className="flex flex-col cursor-pointer select-none"
            onClick={() => navigate('/dashboard')}
          >
            <span className="text-base sm:text-lg font-black tracking-tight text-[#000000] leading-none">
              SPLD <span className="text-[#9E2638]">SAFETY</span>
            </span>
            <span className="text-[10px] text-[#666666] font-medium tracking-wide mt-0.5">
              Safety Management System
            </span>
          </div>

          {/* User profile / Logout */}
          {user && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] border border-[#E5E7EB] bg-white hover:bg-[#F7F8FA] transition-colors text-xs text-[#333333] cursor-pointer"
              >
                <div className="w-5 h-5 rounded-[4px] bg-[#F8EDEF] text-[#9E2638] flex items-center justify-center font-bold text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="hidden sm:inline font-medium">
                  {user.fullName || user.name || user.email}
                </span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-[4px] border border-[#E5E7EB] text-[#666666] hover:text-[#9E2638] hover:bg-[#F8EDEF] transition-colors cursor-pointer"
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
