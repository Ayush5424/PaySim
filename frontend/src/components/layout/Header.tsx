import React, { useState, useEffect } from 'react';
import {
  Menu,
  Bell,
  Eye,
  EyeOff,
  LogOut,
  Moon,
  Sun,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { userApi } from '../../api/userApi';
import { notificationApi } from '../../api/notificationApi';
import { Notification } from '../../types/notification';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface HeaderProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  title,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Balance quick reveal state
  const [balance, setBalance] = useState<number | null>(null);
  const [isBalanceRevealed, setIsBalanceRevealed] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Notifications state
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Copy UPI state
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Fetch unread notifications count
  useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      try {
        const count = await notificationApi.getUnreadCount();
        if (isMounted) setUnreadCount(count);
      } catch {
        // Silent
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleToggleBalance = async () => {
    if (!isBalanceRevealed) {
      if (balance === null && user?.upiId) {
        setIsLoadingBalance(true);
        try {
          const bal = await userApi.getBalance(user.upiId);
          setBalance(bal);
        } catch {
          // Fallback
        } finally {
          setIsLoadingBalance(false);
        }
      }
      setIsBalanceRevealed(true);
    } else {
      setIsBalanceRevealed(false);
    }
  };

  const handleOpenNotifications = async () => {
    setShowNotifications((prev) => !prev);
    if (!showNotifications) {
      try {
        const list = await notificationApi.getNotifications();
        setNotifications(list);
      } catch {
        // Silent
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Silent
    }
  };

  const copyUpiId = () => {
    if (!user?.upiId) return;
    navigator.clipboard.writeText(user.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-white">
            {title || 'Overview'}
          </h1>
        </div>
      </div>

      {/* Right: Quick Balance + Notifications + Theme Toggle + User Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Balance Pill */}
        {user && (
          <div className="hidden md:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">BAL:</span>
            <span className="font-mono font-semibold text-slate-200">
              {isLoadingBalance ? (
                'Loading...'
              ) : isBalanceRevealed && balance !== null ? (
                formatCurrency(balance)
              ) : (
                '₹••,•••.••'
              )}
            </span>
            <button
              onClick={handleToggleBalance}
              className="text-slate-400 hover:text-white transition-colors p-0.5 rounded"
              title={isBalanceRevealed ? 'Hide balance' : 'Show balance'}
            >
              {isBalanceRevealed ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}

        {/* Copy UPI Button */}
        {user?.upiId && (
          <button
            onClick={copyUpiId}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/50 px-2.5 py-1.5 text-xs font-mono text-slate-300 hover:bg-slate-800 transition-colors"
            title="Click to copy UPI ID"
          >
            <span className="truncate max-w-[140px]">{user.upiId}</span>
            {copiedUpi ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={handleOpenNotifications}
            className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-2xl z-50 animate-in fade-in-0 zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-mono text-brand-300">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-brand-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="mt-2 max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">
                    No new notifications
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`py-2.5 px-1 text-xs ${
                        !n.read ? 'bg-slate-800/30' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{n.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatDateTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-400 text-[11px] leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30 hover:border-rose-900/50 transition-colors"
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline font-medium">Logout</span>
        </button>
      </div>
    </header>
  );
};
