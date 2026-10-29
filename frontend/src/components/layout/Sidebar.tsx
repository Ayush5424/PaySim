import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowRightLeft,
  ReceiptText,
  History,
  Settings,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Payments', to: '/payments', icon: ArrowRightLeft },
    { label: 'Transactions', to: '/transactions', icon: History },
    { label: 'Receipts', to: '/receipts', icon: ReceiptText },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-5">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-700 shadow-lg shadow-brand-500/25">
              <span className="font-mono text-base font-bold text-white tracking-wider">PS</span>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">PaySim</span>
            </div>
          </NavLink>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </NavLink>
            );
          })}
        </nav>

        {/* User Card in Footer */}
        {user && (
          <div className="border-t border-slate-800/80 p-3">
            <NavLink
              to="/settings"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-900 transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sm font-bold text-slate-200 border border-slate-700/60 overflow-hidden">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  (user.displayName || user.name || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="truncate text-xs font-semibold text-slate-200">
                    {user.displayName || user.name}
                  </p>
                  {user.verified && (
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                  )}
                </div>
                <p className="truncate text-[11px] font-mono text-slate-400">
                  {user.upiId}
                </p>
              </div>
            </NavLink>
          </div>
        )}
      </aside>
    </>
  );
};
