import React from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { TransactionStatus } from '../../types/transaction';
import { StatusBadge } from '../common/StatusBadge';

interface PaymentStepperProps {
  currentStatus: TransactionStatus;
  transactionId?: string;
  amount?: number;
  receiverUpi?: string;
  failureReason?: string | null;
}

export const PaymentStepper: React.FC<PaymentStepperProps> = ({
  currentStatus,
  transactionId,
  amount,
  receiverUpi,
  failureReason,
}) => {
  const steps: { key: TransactionStatus; label: string; desc: string }[] = [
    {
      key: 'INITIATED',
      label: 'Initiated',
      desc: 'Payment request received',
    },
    {
      key: 'PROCESSING',
      label: 'Processing',
      desc: 'Processing transfer',
    },
    {
      key: currentStatus === 'FAILED' ? 'FAILED' : 'SUCCESS',
      label: currentStatus === 'FAILED' ? 'Failed' : 'Completed',
      desc:
        currentStatus === 'FAILED'
          ? failureReason || 'Transaction could not be completed'
          : 'Payment completed successfully',
    },
  ];

  const getStepState = (_stepKey: TransactionStatus, index: number) => {
    if (currentStatus === 'FAILED') {
      if (index === 2) return 'failed';
      return 'completed';
    }
    if (currentStatus === 'SUCCESS') {
      return 'completed';
    }
    if (currentStatus === 'PROCESSING') {
      if (index === 0) return 'completed';
      if (index === 1) return 'active';
      return 'pending';
    }
    // INITIATED
    if (index === 0) return 'active';
    return 'pending';
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Payment Status
          </h3>
        </div>
        <StatusBadge status={currentStatus} size="lg" />
      </div>

      {/* Stepper Timeline */}
      <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, idx) => {
          const state = getStepState(step.key, idx);

          let icon = (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 text-xs font-mono font-bold">
              {idx + 1}
            </div>
          );

          let border = 'border-slate-800 bg-slate-950/40';
          let titleColor = 'text-slate-400';

          if (state === 'completed') {
            icon = (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            );
            border = 'border-emerald-900/40 bg-emerald-950/10';
            titleColor = 'text-emerald-300';
          } else if (state === 'active') {
            icon = (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            );
            border = 'border-sky-800/60 bg-sky-950/20 shadow-lg shadow-sky-950/50';
            titleColor = 'text-sky-300';
          } else if (state === 'failed') {
            icon = (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <XCircle className="h-5 w-5" />
              </div>
            );
            border = 'border-rose-900/40 bg-rose-950/20';
            titleColor = 'text-rose-400';
          }

          return (
            <div
              key={step.key}
              className={`relative flex flex-col rounded-xl border p-4 transition-all ${border}`}
            >
              <div className="flex items-center gap-3">
                {icon}
                <div>
                  <h4 className={`text-sm font-semibold tracking-tight ${titleColor}`}>
                    {step.label}
                  </h4>
                  <span className="text-[10px] font-mono uppercase text-slate-500">
                    Step 0{idx + 1}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Meta Bar */}
      {(transactionId || receiverUpi || amount) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 text-xs font-mono">
          {transactionId && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 uppercase">TXN ID:</span>
              <span className="text-slate-200">{transactionId}</span>
            </div>
          )}
          {receiverUpi && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 uppercase">TO:</span>
              <span className="text-brand-300">{receiverUpi}</span>
            </div>
          )}
          {amount && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 uppercase">AMOUNT:</span>
              <span className="font-bold text-white">₹{amount.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
