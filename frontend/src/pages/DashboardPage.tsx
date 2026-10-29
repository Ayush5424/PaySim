import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  QrCode,
  Eye,
  EyeOff,
  RefreshCw,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/userApi';
import { transactionApi } from '../api/transactionApi';
import { Transaction } from '../types/transaction';
import { StatCard } from '../components/common/StatCard';
import { StatCardSkeleton } from '../components/common/LoadingSkeleton';
import { TransactionTable } from '../components/transaction/TransactionTable';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../components/common/Toast';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error } = useToast();

  const [balance, setBalance] = useState<number | null>(null);
  const [isBalanceRevealed, setIsBalanceRevealed] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    if (!user?.upiId) return;

    try {
      const [balResult, txnsResult] = await Promise.allSettled([
        userApi.getBalance(user.upiId),
        transactionApi.getMyTransactions(user.upiId),
      ]);

      if (balResult.status === 'fulfilled') {
        setBalance(balResult.value);
      }

      if (txnsResult.status === 'fulfilled') {
        setTransactions(txnsResult.value);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not fetch dashboard data';
      error(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.upiId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  // Real backend calculated metrics
  const totalCount = transactions.length;
  const successCount = transactions.filter((t) => t.status === 'SUCCESS').length;
  const processingCount = transactions.filter(
    (t) => t.status === 'PROCESSING' || t.status === 'INITIATED'
  ).length;
  const failedCount = transactions.filter((t) => t.status === 'FAILED').length;
  const successVolume = transactions
    .filter((t) => t.status === 'SUCCESS')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Top Banner: Greeting & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Welcome back, {user?.displayName || user?.name || 'User'}
          </h2>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            UPI ID: <span className="text-brand-400">{user?.upiId}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
            title="Refresh metrics"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/payments')}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-500 active:scale-95 transition-all"
          >
            <ArrowRightLeft className="h-4 w-4" />
            <span>Send Payment</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* Total Payments */}
            <StatCard
              title="Total Payments"
              value={totalCount}
              subtitle={`Total volume: ${formatCurrency(successVolume)}`}
              icon={<CreditCard className="h-4 w-4 text-brand-400" />}
              badge={{ text: `${totalCount} TXNS`, variant: 'neutral' }}
            />

            {/* Successful */}
            <StatCard
              title="Successful"
              value={successCount}
              subtitle={`${successRate}% execution success rate`}
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              badge={{ text: `${successRate}% RATE`, variant: 'emerald' }}
            />

            {/* Processing / Initiated */}
            <StatCard
              title="Processing"
              value={processingCount}
              subtitle="Pending settlement"
              icon={<Clock className="h-4 w-4 text-sky-400" />}
              badge={{ text: `${processingCount} ACTIVE`, variant: 'sky' }}
            />

            {/* Failed */}
            <StatCard
              title="Failed"
              value={failedCount}
              subtitle="Declined transactions"
              icon={<AlertTriangle className="h-4 w-4 text-rose-400" />}
              badge={{ text: `${failedCount} FAILED`, variant: 'rose' }}
            />
          </>
        )}
      </div>

      {/* Account Balance & Wallet Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Available Balance
              </span>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                  {isLoading
                    ? 'Loading...'
                    : isBalanceRevealed && balance !== null
                    ? formatCurrency(balance)
                    : '₹••,•••.••'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsBalanceRevealed(!isBalanceRevealed)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                  aria-label={isBalanceRevealed ? 'Hide balance' : 'Show balance'}
                >
                  {isBalanceRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/payments')}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
            >
              <QrCode className="h-4 w-4" />
              <span>Show QR</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
            >
              <span>Verify with PIN</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-white">
              Recent Transactions
            </h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
          >
            <span>View all</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <TransactionTable
          transactions={transactions}
          isLoading={isLoading}
          limit={5}
          showFilters={false}
          emptyMessage="No transactions yet"
        />
      </div>
    </div>
  );
};
