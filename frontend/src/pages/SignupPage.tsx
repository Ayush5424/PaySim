import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isValidPhone } from '../utils/formatters';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [initialBalance, setInitialBalance] = useState('10000');
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanPin = pin.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setErrorMessage('Full Name is required');
      return;
    }

    if (!cleanPhone || !isValidPhone(cleanPhone)) {
      setErrorMessage('Enter a valid 10-digit mobile number');
      return;
    }

    if (!cleanPin || cleanPin.length < 4 || !/^\d{4,6}$/.test(cleanPin)) {
      setErrorMessage('PIN must be 4 to 6 numeric digits');
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        name: cleanName,
        phoneNumber: cleanPhone,
        email: cleanEmail || null,
        pin: cleanPin,
        password: cleanPin,
        initialBalance: parseFloat(initialBalance) || 10000,
      });

      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. The phone number or email may already be in use.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-brand-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-700 shadow-xl shadow-brand-500/25">
            <span className="font-mono text-xl font-extrabold text-white">PS</span>
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Create an Account
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Get started with PaySim
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-900/50 bg-rose-950/30 p-3.5 text-xs text-rose-300 animate-in fade-in-0 duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ayush Kumar"
                required
                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                10-Digit Mobile Number
              </label>
              <div className="mt-1.5 flex rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-colors">
                <span className="flex items-center bg-slate-900 px-3 text-xs font-mono text-slate-400 border-r border-slate-800">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  required
                  className="w-full bg-transparent px-3 py-2.5 text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 font-mono">
                Your UPI ID will be: {phone ? `${phone}@paysim` : 'yourphone@paysim'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Email Address <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Set UPI Security PIN
                </label>
                <span className="text-[11px] text-slate-500 font-mono">4–6 digits</span>
              </div>
              <div className="relative mt-1.5">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 pr-10 text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Initial Balance (₹)
              </label>
              <div className="mt-1.5 flex gap-2">
                {['1000', '5000', '10000', '50000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setInitialBalance(amt)}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-mono font-medium transition-all ${
                      initialBalance === amt
                        ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    ₹{parseInt(amt).toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:bg-brand-500 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-800/80 pt-4">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-brand-400 hover:text-brand-300 transition-colors underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
