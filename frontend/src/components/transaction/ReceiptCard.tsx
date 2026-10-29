import React from 'react';
import {
  Printer,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { PaymentReceipt } from '../../types/payment';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useToast } from '../common/Toast';

interface ReceiptCardProps {
  receipt: PaymentReceipt;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ receipt }) => {
  const { success } = useToast();
  const [copied, setCopied] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = [
      '========================================',
      '        PAYSIM PAYMENT RECEIPT          ',
      '========================================',
      `Transaction ID : ${receipt.transactionId}`,
      `Reference (UTR): ${receipt.referenceId || 'N/A'}`,
      `Status         : ${receipt.status}`,
      `Amount         : ${formatCurrency(receipt.amount)}`,
      `Date & Time    : ${formatDateTime(receipt.timestamp)}`,
      `Paid From      : ${receipt.senderName || receipt.senderUpi} (${receipt.senderUpi})`,
      `Paid To        : ${receipt.receiverName || receipt.receiverUpi} (${receipt.receiverUpi})`,
      `Payment Method : ${receipt.paymentMethod || 'UPI'}`,
      receipt.failureReason ? `Failure Reason : ${receipt.failureReason}` : '',
      '========================================',
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    success('Receipt text copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Action Toolbar (hidden on print) */}
      <div className="mb-6 flex items-center justify-end gap-3 w-full max-w-xl print:hidden">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          Copy Receipt
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 transition-all shadow-lg shadow-brand-500/20 active:scale-95"
        >
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Official Bank-Grade Receipt Voucher Card */}
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-xl print:border-slate-300 print:bg-white print:text-slate-900 print:shadow-none">
        {/* Receipt Header */}
        <div className="border-b border-slate-800/80 bg-slate-950/60 p-6 sm:p-8 print:bg-slate-50 print:border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-mono text-sm font-bold text-white">
                  PS
                </div>
                <span className="text-xl font-bold tracking-tight text-white print:text-slate-900">
                  PaySim
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 print:text-slate-600 font-mono">
                Payment Receipt
              </p>
            </div>
            <StatusBadge status={receipt.status} size="lg" />
          </div>

          {/* Amount Highlight */}
          <div className="mt-8 text-center sm:text-left">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 print:text-slate-500">
              Amount
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono mt-1 print:text-slate-900">
              {formatCurrency(receipt.amount)}
            </div>
          </div>
        </div>

        {/* Transfer Parties Flow Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-800/80 bg-slate-950/20 p-6 print:border-slate-200 print:bg-transparent">
          {/* Sender */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 print:border-slate-200 print:bg-white">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 print:text-slate-500">
              Paid From
            </span>
            <h4 className="mt-1 text-sm font-semibold text-slate-100 print:text-slate-900">
              {receipt.senderName || receipt.senderUpi}
            </h4>
            <p className="mt-0.5 text-xs font-mono text-slate-400 print:text-slate-600">
              {receipt.senderUpi}
            </p>
          </div>

          {/* Receiver */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 print:border-slate-200 print:bg-white">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 print:text-slate-500">
              Paid To
            </span>
            <h4 className="mt-1 text-sm font-semibold text-slate-100 print:text-slate-900">
              {receipt.receiverName || receipt.receiverUpi}
            </h4>
            <p className="mt-0.5 text-xs font-mono text-slate-400 print:text-slate-600">
              {receipt.receiverUpi}
            </p>
          </div>
        </div>

        {/* Itemized Technical Details */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-800/60 print:border-slate-200">
            <span className="text-slate-400 print:text-slate-500 font-mono">Transaction ID</span>
            <span className="font-mono font-medium text-slate-200 print:text-slate-900">
              {receipt.transactionId}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-800/60 print:border-slate-200">
            <span className="text-slate-400 print:text-slate-500 font-mono">Reference ID</span>
            <span className="font-mono text-slate-200 print:text-slate-900">
              {receipt.referenceId || receipt.transactionId}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-800/60 print:border-slate-200">
            <span className="text-slate-400 print:text-slate-500 font-mono">Timestamp</span>
            <span className="font-mono text-slate-200 print:text-slate-900">
              {formatDateTime(receipt.timestamp)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-800/60 print:border-slate-200">
            <span className="text-slate-400 print:text-slate-500 font-mono">Payment Method</span>
            <span className="font-mono text-slate-200 print:text-slate-900 uppercase">
              {receipt.paymentMethod || 'UPI'}
            </span>
          </div>

          {receipt.failureReason && (
            <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3 text-xs text-rose-300">
              <span className="font-bold">Failure Reason:</span> {receipt.failureReason}
            </div>
          )}
        </div>

        {/* Receipt Footer */}
        <div className="border-t border-slate-800/80 bg-slate-950/60 p-4 text-center text-xs text-slate-400 font-mono print:bg-slate-50 print:border-slate-200 print:text-slate-500">
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Verified Payment</span>
          </div>
        </div>
      </div>
    </div>
  );
};
