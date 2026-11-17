import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, User, Info } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Temuan K3', path: '/findings', icon: ClipboardList },
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'About', path: '/about', icon: Info },
];

export const BottomNavigationBar: React.FC = () => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      aria-label="Main Navigation"
    >
      <div className="max-w-screen-md mx-auto px-4">
        <ul className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path} className="flex-1">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center py-1 transition-all duration-200 group ${
                      isActive
                        ? 'text-red-600 font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="relative">
                        <Icon
                          className={`w-5 h-5 transition-transform duration-200 ${
                            isActive ? 'scale-110' : 'group-hover:scale-105'
                          }`}
                        />
                        {isActive && (
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-600 rounded-full" />
                        )}
                      </div>
                      <span className="text-xs mt-1 tracking-tight">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
