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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E7EB]"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      aria-label="Main Navigation"
    >
      <div className="max-w-screen-md mx-auto px-4">
        <ul className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path} className="flex-1">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors duration-150 ${
                      isActive
                        ? 'text-[#9E2638] font-semibold'
                        : 'text-[#666666] hover:text-[#000000] font-normal'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-5 h-5 ${
                          isActive ? 'text-[#9E2638]' : 'text-[#666666]'
                        }`}
                      />
                      <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
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
