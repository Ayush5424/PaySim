import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Copy,
  Check,
  Receipt,
} from 'lucide-react';
import { Transaction } from '../../types/transaction';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRefresh?: () => void;
  showFilters?: boolean;
  limit?: number;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  isLoading = false,
  emptyMessage = 'No transactions found',
  showFilters = true,
  limit,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SENT' | 'RECEIVED'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyTxnId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    success('Transaction ID copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTransactions = useMemo(() => {
    let list = [...transactions];

    // Status filter
    if (statusFilter !== 'ALL') {
      list = list.filter((t) => t.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'ALL' && user?.upiId) {
      if (typeFilter === 'SENT') {
        list = list.filter((t) => t.senderUpi === user.upiId);
      } else {
        list = list.filter((t) => t.receiverUpi === user.upiId);
      }
    }

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.transactionId?.toLowerCase().includes(q) ||
          t.senderUpi?.toLowerCase().includes(q) ||
          t.receiverUpi?.toLowerCase().includes(q) ||
          t.idempotencyKey?.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    list.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt).getTime();
      const dateB = new Date(b.createdAt || b.updatedAt).getTime();
      return dateB - dateA;
    });

    if (limit && limit > 0) {
      return list.slice(0, limit);
    }

    return list;
  }, [transactions, statusFilter, typeFilter, searchQuery, user?.upiId, limit]);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
      {/* Optional Filter Controls Bar */}
      {showFilters && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ID, UPI, or idempotency key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors font-mono"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Selector */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/80 p-1">
              {(['ALL', 'SUCCESS', 'PROCESSING', 'FAILED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    statusFilter === st
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Direction Selector */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/80 p-1">
              {(['ALL', 'SENT', 'RECEIVED'] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setTypeFilter(dir)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    typeFilter === dir
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Transaction ID</th>
              <th className="py-3.5 px-4 font-semibold">Counterparty</th>
              <th className="py-3.5 px-4 font-semibold">Amount</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold hidden md:table-cell">Created At</th>
              <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-4 w-28 bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-32 bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-5 w-20 bg-slate-800 rounded-full" /></td>
                  <td className="py-4 px-4 hidden md:table-cell"><div className="h-4 w-24 bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-6 w-16 bg-slate-800 rounded ml-auto" /></td>
                </tr>
              ))
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <p className="text-sm font-medium">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => {
                const isDebit = user?.upiId ? t.senderUpi === user.upiId : false;
                const otherParty = isDebit ? t.receiverUpi : t.senderUpi;

                return (
                  <tr
                    key={t.id || t.transactionId}
                    onClick={() => navigate(`/transactions/${t.transactionId}`)}
                    className="group cursor-pointer hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Transaction ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-medium text-slate-200 group-hover:text-brand-400 transition-colors">
                          {t.transactionId.length > 18
                            ? `${t.transactionId.slice(0, 10)}...${t.transactionId.slice(-6)}`
                            : t.transactionId}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => copyTxnId(t.transactionId, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white p-0.5"
                          title="Copy ID"
                        >
                          {copiedId === t.transactionId ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Counterparty */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            isDebit
                              ? 'border-rose-900/40 bg-rose-950/40 text-rose-400'
                              : 'border-emerald-900/40 bg-emerald-950/40 text-emerald-400'
                          }`}
                        >
                          {isDebit ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-200">
                            {otherParty}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {isDebit ? 'Debited to' : 'Credited from'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-mono font-bold ${
                          isDebit ? 'text-slate-100' : 'text-emerald-400'
                        }`}
                      >
                        {isDebit ? '−' : '+'}
                        {formatCurrency(t.amount)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={t.status} size="sm" />
                    </td>

                    {/* Created */}
                    <td className="py-3.5 px-4 hidden md:table-cell text-slate-400 font-mono text-[11px]">
                      {formatDateTime(t.createdAt || t.updatedAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => navigate(`/receipts/${t.transactionId}`)}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                          title="View Receipt"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Receipt</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/transactions/${t.transactionId}`)}
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
