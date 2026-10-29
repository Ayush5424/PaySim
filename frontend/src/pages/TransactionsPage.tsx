import React, { useState, useEffect } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { transactionApi } from '../api/transactionApi';
import { Transaction } from '../types/transaction';
import { TransactionTable } from '../components/transaction/TransactionTable';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../components/common/Toast';

export const TransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const { error, success } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTransactions = async () => {
    if (!user?.upiId) return;

    try {
      const data = await transactionApi.getMyTransactions(user.upiId);
      setTransactions(data || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch transaction history';
      error(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user?.upiId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTransactions();
  };

  const handleExportCsv = () => {
    if (transactions.length === 0) {
      error('No transactions available to export');
      return;
    }

    const headers = [
      'Transaction ID',
      'Reference ID',
      'Sender UPI',
      'Receiver UPI',
      'Amount (INR)',
      'Status',
      'Payment Method',
      'Idempotency Key',
      'Created At',
    ];

    const rows = transactions.map((t) => [
      `"${t.transactionId}"`,
      `"${t.referenceId || ''}"`,
      `"${t.senderUpi}"`,
      `"${t.receiverUpi}"`,
      t.amount,
      `"${t.status}"`,
      `"${t.paymentMethod || 'UPI'}"`,
      `"${t.idempotencyKey || ''}"`,
      `"${t.createdAt || t.updatedAt}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `paysim-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('Transactions CSV exported successfully');
  };

  // Metrics summary
  const totalVolume = transactions
    .filter((t) => t.status === 'SUCCESS')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const averageTicket =
    transactions.length > 0 ? totalVolume / (transactions.filter((t) => t.status === 'SUCCESS').length || 1) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Transactions
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={transactions.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Total Transactions
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-white">
            {transactions.length}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Total Volume
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-400">
            {formatCurrency(totalVolume)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Average Amount
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-slate-200">
            {formatCurrency(averageTicket)}
          </div>
        </div>
      </div>

      {/* Full Transactions Data Table */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <TableSkeleton rows={8} cols={6} />
        </div>
      ) : (
        <TransactionTable
          transactions={transactions}
          isLoading={false}
          showFilters={true}
          emptyMessage="No transactions found"
        />
      )}
    </div>
  );
};
