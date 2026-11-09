import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { Button } from './Button';
import { authService } from '../../services/authService';
import {
  Menu,
  X,
  LogOut,
  UserPlus,
  HelpCircle,
  Database,
  Footprints,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';
import { DemoAccountsModal } from '../auth/DemoAccountsModal';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
        {/* Top corporate alert / safety banner */}
        <div className="bg-gray-900 text-gray-300 text-[11px] py-1 px-4 border-b border-gray-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EB0A1E] animate-pulse" />
              <span className="font-semibold text-white tracking-wide">
                SAFETY FIRST (安全第一)
              </span>
              <span className="hidden sm:inline text-gray-400">
                • Service Parts Logistic Division (SPLD)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDemoModalOpen(true)}
                className="text-xs font-medium text-red-400 hover:text-white flex items-center gap-1 transition-colors underline decoration-dotted cursor-pointer"
                title="Buka panel akun demo prototype"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Test Prototype Accounts</span>
              </button>
              <span className="text-gray-600 hidden md:inline">|</span>
              <span className="hidden md:inline text-gray-400">Module 05: Patrol & Findings</span>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="focus:outline-none">
              <BrandLogo size="md" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'text-[#EB0A1E] bg-red-50 font-semibold'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Welcome
              </Link>

              {currentUser ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive('/dashboard')
                        ? 'text-[#EB0A1E] bg-red-50 font-semibold'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Dashboard
                  </Link>

                  {/* Safety Patrol Navigation */}
                  <Link
                    to="/patrols"
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/patrols')
                        ? 'text-[#EB0A1E] bg-red-50 font-semibold'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Footprints className="w-3.5 h-3.5" />
                    <span>Safety Patrol</span>
                  </Link>

                  {/* Finding Navigation based on Role */}
                  {currentUser.role === 'MEMBER' ? (
                    <Link
                      to="/my-findings"
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        isActive('/my-findings')
                          ? 'text-[#EB0A1E] bg-red-50 font-semibold'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>Laporan Saya</span>
                    </Link>
                  ) : (
                    <Link
                      to="/findings"
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        isActive('/findings')
                          ? 'text-[#EB0A1E] bg-red-50 font-semibold'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Temuan K3</span>
                    </Link>
                  )}

                  {currentUser.role === 'QSHE_ADMIN' && (
                    <>
                      <Link
                        to="/admin"
                        className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1 ${
                          isActive('/admin') && !isActive('/admin/master-data')
                            ? 'text-white bg-gray-900 shadow-xs'
                            : 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EB0A1E]" />
                        <span>Admin Portal</span>
                      </Link>

                      <Link
                        to="/admin/master-data"
                        className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                          isActive('/admin/master-data')
                            ? 'text-white bg-gray-900 shadow-xs'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <Database className="w-3.5 h-3.5 text-red-600" />
                        <span>Master Data</span>
                      </Link>
                    </>
                  )}

                  <div className="h-5 w-px bg-gray-200 mx-1.5" />

                  {/* Logged in User Pill */}
                  <div className="flex items-center gap-2 pl-2 pr-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                    <div className="w-7 h-7 rounded-full bg-[#EB0A1E] text-white flex items-center justify-center font-bold">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 leading-tight">
                        {currentUser.fullName}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {currentUser.noreg} • {currentUser.department}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    leftIcon={<LogOut className="w-3.5 h-3.5" />}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/login'
                        ? 'text-[#EB0A1E] bg-red-50 font-semibold'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Login
                  </Link>
                  <Link to="/register">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<UserPlus className="w-4 h-4" />}
                    >
                      Register Member
                    </Button>
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDemoModalOpen(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                aria-label="Demo Accounts"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-4 space-y-2">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-gray-100"
            >
              Welcome Page
            </Link>

            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-gray-100"
                >
                  Safety Dashboard
                </Link>

                <Link
                  to="/patrols"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Footprints className="w-4 h-4 text-[#EB0A1E]" />
                  <span>Safety Patrol</span>
                </Link>

                {currentUser.role === 'MEMBER' ? (
                  <Link
                    to="/my-findings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <ClipboardList className="w-4 h-4 text-[#EB0A1E]" />
                    <span>Laporan Saya</span>
                  </Link>
                ) : (
                  <Link
                    to="/findings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-[#EB0A1E]" />
                    <span>Temuan K3 (Findings)</span>
                  </Link>
                )}

                {currentUser.role === 'QSHE_ADMIN' && (
                  <>
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-base font-bold text-red-700 bg-red-50 hover:bg-red-100"
                    >
                      QSHE Admin Portal
                    </Link>
                    <Link
                      to="/admin/master-data"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Database className="w-4 h-4 text-red-600" />
                      <span>Master Data Hub</span>
                    </Link>
                  </>
                )}

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-[#EB0A1E] text-white flex items-center justify-center font-bold">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {currentUser.fullName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {currentUser.noreg} • {currentUser.department}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    fullWidth
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    leftIcon={<LogOut className="w-4 h-4" />}
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-gray-100"
                >
                  Login to Account
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block pt-1"
                >
                  <Button variant="primary" fullWidth size="md">
                    Register Member
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* Test Prototype Accounts Modal */}
      <DemoAccountsModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </>
  );
};
