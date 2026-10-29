import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { paymentApi } from '../api/paymentApi';
import { transactionApi } from '../api/transactionApi';
import { useAuth } from '../context/AuthContext';
import { PaymentReceipt } from '../types/payment';
import { ReceiptCard } from '../components/transaction/ReceiptCard';
import { Skeleton } from '../components/common/LoadingSkeleton';

export const ReceiptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    const loadReceipt = async () => {
      try {
        let targetId = id;

        // If no ID in URL, get latest transaction from user's history
        if (!targetId && user?.upiId) {
          const list = await transactionApi.getMyTransactions(user.upiId);
          if (list.length > 0) {
            targetId = list[0].transactionId;
          }
        }

        if (!targetId) {
          if (isMounted) {
            setIsLoading(false);
            setErrorMessage('No transaction specified or found.');
          }
          return;
        }

        const data = await paymentApi.getReceipt(targetId);
        if (isMounted) {
          setReceipt(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Could not fetch payment receipt.';
          setErrorMessage(msg);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadReceipt();
    return () => {
      isMounted = false;
    };
  }, [id, user?.upiId]);

  return (
    <div className="space-y-6">
      {/* Back button (hidden on print) */}
      <div className="flex items-center justify-between print:hidden">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
      </div>

      {isLoading ? (
        <div className="mx-auto max-w-xl space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : errorMessage || !receipt ? (
        <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Receipt Unavailable</h3>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            {errorMessage || 'Payment receipt could not be found.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="mt-5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 transition-all"
          >
            View Transactions
          </button>
        </div>
      ) : (
        <ReceiptCard receipt={receipt} />
      )}
    </div>
  );
};
