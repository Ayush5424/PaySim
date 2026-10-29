import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Wallet,
  Camera,
  Trash2,
  Save,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/userApi';
import { PinKeypad } from '../components/common/PinKeypad';
import { Modal } from '../components/common/Modal';
import { formatCurrency, formatPhone } from '../utils/formatters';
import { useToast } from '../components/common/Toast';

export const SettingsPage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { success, error, info } = useToast();

  // Profile Edit State
  const [displayName, setDisplayName] = useState(user?.displayName || user?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  // PIN-Gated Balance State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [verifiedBalance, setVerifiedBalance] = useState<number | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.phoneNumber || !displayName.trim()) return;

    setIsSavingName(true);
    try {
      const updated = await userApi.updateProfile(user.phoneNumber, {
        displayName: displayName.trim(),
      });
      updateUser({
        displayName: updated.displayName || displayName.trim(),
      });
      success('Display name updated successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      error(msg);
    } finally {
      setIsSavingName(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.phoneNumber) return;

    if (!file.type.startsWith('image/')) {
      error('Please select a valid image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      error('Profile image must be under 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        await userApi.updateProfile(user.phoneNumber, {
          profilePhoto: base64,
          displayName: user.displayName || user.name,
        });
        updateUser({ profilePhoto: base64 });
        success('Profile photo updated');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Could not upload photo';
        error(msg);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    if (!user?.phoneNumber) return;
    try {
      await userApi.removePhoto(user.phoneNumber);
      updateUser({ profilePhoto: null });
      info('Profile photo removed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not remove photo';
      error(msg);
    }
  };

  const handleVerifyBalancePin = async (enteredPin: string) => {
    if (!user?.upiId) return;

    setIsVerifyingPin(true);
    try {
      const bal = await userApi.getBalanceWithPin(user.upiId, enteredPin);
      setVerifiedBalance(bal);
      setIsPinModalOpen(false);
      success('Balance verified successfully via PIN authentication');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Incorrect UPI PIN';
      error(msg);
      setPinValue('');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">
          Settings
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
            <h3 className="text-sm font-bold text-white tracking-tight pb-3 border-b border-slate-800">
              Profile
            </h3>

            {/* Avatar & Photo Actions */}
            <div className="mt-5 flex items-center gap-4">
              <div className="relative group">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-800 text-xl font-bold text-white shadow-xl overflow-hidden border border-slate-700">
                  {user?.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (user?.displayName || user?.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>

                <label
                  htmlFor="photo-upload"
                  className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                  title="Change avatar"
                >
                  <Camera className="h-5 w-5" />
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">
                  {user?.displayName || user?.name}
                </h4>
                <p className="text-xs font-mono text-brand-400">{user?.upiId}</p>
                {user?.profilePhoto && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="mt-1 flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Remove photo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Display Name Edit Form */}
            <form onSubmit={handleSaveDisplayName} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Display Name
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isSavingName}
                    className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSavingName ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>Save</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs pt-2">
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">Mobile Number</span>
                  <span className="text-slate-200">{formatPhone(user?.phoneNumber)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">Email Address</span>
                  <span className="text-slate-200">{user?.email || 'Not configured'}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">Account Verification</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>VERIFIED</span>
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Balance & Security */}
        <div className="lg:col-span-6 space-y-6">
          {/* Balance Inquiry Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-brand-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Account Balance
                </h3>
              </div>
            </div>

            {verifiedBalance !== null ? (
              <div className="mt-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
                <span className="text-[10px] font-mono uppercase text-emerald-400">
                  Available Balance
                </span>
                <div className="mt-1 text-2xl font-bold font-mono text-white">
                  {formatCurrency(verifiedBalance)}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVerifiedBalance(null);
                    setPinValue('');
                  }}
                  className="mt-3 text-xs text-slate-400 hover:text-white underline font-mono"
                >
                  Hide balance
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPinValue('');
                  setIsPinModalOpen(true);
                }}
                className="mt-4 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
              >
                <KeyRound className="h-4 w-4 text-brand-400" />
                <span>View Balance</span>
              </button>
            )}
          </div>

          {/* Security Information */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3 font-mono text-xs">
            <h3 className="text-sm font-bold text-white tracking-tight font-sans pb-2 border-b border-slate-800">
              Security
            </h3>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">Security PIN</span>
              <span className="text-slate-200">Configured (••••)</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">Session</span>
              <span className="text-emerald-400">Active</span>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 rounded-xl border border-rose-900/50 bg-rose-950/20 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PIN Modal */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title="Enter UPI PIN"
        description="Enter your 4 to 6 digit PIN to view your balance"
        maxWidth="sm"
      >
        <PinKeypad
          value={pinValue}
          onChange={(newPin) => setPinValue(newPin)}
          onSubmit={handleVerifyBalancePin}
          isLoading={isVerifyingPin}
          title="Security PIN"
        />
      </Modal>
    </div>
  );
};
