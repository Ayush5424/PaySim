import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Receipt,
  Copy,
  Check,
  KeyRound,
  Code2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { transactionApi } from '../api/transactionApi';
import { paymentApi } from '../api/paymentApi';
import { Transaction } from '../types/transaction';
import { StatusBadge } from '../components/common/StatusBadge';
import { Skeleton } from '../components/common/LoadingSkeleton';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useToast } from '../components/common/Toast';

export const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user?.upiId) return;

    let isMounted = true;
    setIsLoading(true);

    const loadData = async () => {
      try {
        // Try to find in user transactions list
        const list = await transactionApi.getMyTransactions(user.upiId);
        const match = list.find(
          (t) => t.transactionId === id || String(t.id) === id
        );

        if (match && isMounted) {
          setTransaction(match);
        } else {
          // Fallback: fetch receipt
          const receipt = await paymentApi.getReceipt(id);
          if (receipt && isMounted) {
            setTransaction({
              id: 0,
              transactionId: receipt.transactionId,
              referenceId: receipt.referenceId,
              senderUpi: receipt.senderUpi,
              receiverUpi: receipt.receiverUpi,
              amount: receipt.amount,
              currency: receipt.currency || 'INR',
              status: receipt.status as any,
              paymentMethod: receipt.paymentMethod,
              failureReason: receipt.failureReason,
              createdAt: receipt.timestamp,
              updatedAt: receipt.timestamp,
            });
          }
        }
      } catch (e: unknown) {
        if (isMounted) {
          const msg = e instanceof Error ? e.message : 'Could not find transaction details';
          error(msg);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id, user?.upiId]);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
        <AlertCircle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Transaction Not Found</h3>
        <p className="mt-1 text-xs text-slate-400 font-mono">
          Transaction "{id}" was not found.
        </p>
        <button
          type="button"
          onClick={() => navigate('/transactions')}
          className="mt-6 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 transition-all"
        >
          Return to Transactions
        </button>
      </div>
    );
  }

  const isDebit = user?.upiId ? transaction.senderUpi === user.upiId : false;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Back to transactions"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-white">
                Transaction Details
              </h2>
              <StatusBadge status={transaction.status} size="sm" />
            </div>
            <p className="text-xs text-slate-400 font-mono">
              ID: {transaction.transactionId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/receipts/${transaction.transactionId}`)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-500 transition-all"
          >
            <Receipt className="h-4 w-4" />
            <span>Receipt</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Transaction Overview & Parties */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Summary Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Amount
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                {isDebit ? '−' : '+'}
                {formatCurrency(transaction.amount)}
              </span>
              <span className="text-xs font-mono text-slate-400">INR</span>
            </div>

            {/* Beneficiary Flow */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-[10px] font-mono uppercase text-slate-500">
                  Paid From
                </span>
                <p className="mt-1 text-sm font-semibold text-slate-100 truncate">
                  {transaction.senderUpi}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-[10px] font-mono uppercase text-slate-500">
                  Paid To
                </span>
                <p className="mt-1 text-sm font-semibold text-slate-100 truncate">
                  {transaction.receiverUpi}
                </p>
              </div>
            </div>

            {transaction.failureReason && (
              <div className="mt-6 rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 text-xs text-rose-300">
                <span className="font-bold">Failure Reason:</span> {transaction.failureReason}
              </div>
            )}
          </div>

          {/* Audit Trail Timeline */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h3 className="text-sm font-bold text-white tracking-tight mb-4">
              Timeline
            </h3>
            <div className="space-y-4 text-xs font-mono">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-200">
                    PAYMENT INITIATED
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    {formatDateTime(transaction.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                    transaction.status === 'FAILED' ? 'bg-rose-400' : 'bg-emerald-400'
                  }`}
                />
                <div>
                  <div className="font-semibold text-slate-200">
                    STATUS: {transaction.status}
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    {formatDateTime(transaction.updatedAt || transaction.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Technical & Idempotency Metadata */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Payment Details
              </h3>
            </div>

            {/* Idempotency Key highlight */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-brand-400" />
                  <span className="text-[10px] font-mono uppercase text-slate-400">
                    Idempotency Key
                  </span>
                </div>
                {transaction.idempotencyKey && (
                  <button
                    type="button"
                    onClick={() => copyText(transaction.idempotencyKey!, 'Idempotency Key')}
                    className="text-[10px] text-brand-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    {copiedKey === 'Idempotency Key' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>Copy</span>
                  </button>
                )}
              </div>
              <p className="font-mono text-xs text-slate-200 break-all">
                {transaction.idempotencyKey || 'Generated on submission'}
              </p>
            </div>

            {/* Reference ID / UTR */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  Reference ID
                </span>
                {transaction.referenceId && (
                  <button
                    type="button"
                    onClick={() => copyText(transaction.referenceId, 'Reference ID')}
                    className="text-[10px] text-brand-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    {copiedKey === 'Reference ID' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>Copy</span>
                  </button>
                )}
              </div>
              <p className="font-mono text-xs text-slate-200 break-all">
                {transaction.referenceId || transaction.transactionId}
              </p>
            </div>

            {/* Protocol */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                Payment Method
              </span>
              <p className="font-mono text-xs text-slate-200 uppercase">
                {transaction.paymentMethod || 'UPI'}
              </p>
            </div>

            {/* Full JSON Payload Inspection */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const json = JSON.stringify(transaction, null, 2);
                  navigator.clipboard.writeText(json);
                  success('JSON details copied to clipboard');
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm font-mono"
              >
                <Code2 className="h-4 w-4" />
                <span>Copy JSON Details</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
