import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  ArrowRightLeft,
  QrCode,
  Scan,
  RefreshCw,
  KeyRound,
  ArrowRight,
  Receipt,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/userApi';
import { paymentApi } from '../api/paymentApi';
import { generateIdempotencyKey } from '../utils/idempotency';
import { isValidPhone, isValidUpiId, formatCurrency } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import { PinKeypad } from '../components/common/PinKeypad';
import { PaymentStepper } from '../components/payment/PaymentStepper';
import { QrScannerModal } from '../components/payment/QrScannerModal';
import { MyQrCard } from '../components/payment/MyQrCard';
import { TransactionStatus } from '../types/transaction';
import { useToast } from '../components/common/Toast';
import { ParsedUpiData } from '../utils/qr';

export const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');

  // Form State
  const [recipientType, setRecipientType] = useState<'phone' | 'upi'>('upi');
  const [phoneInput, setPhoneInput] = useState('');
  const [upiInput, setUpiInput] = useState('');
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [isLookingUpPhone, setIsLookingUpPhone] = useState(false);

  const [amount, setAmount] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey());

  // PIN & Execution State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Execution Lifecycle State
  const [executionState, setExecutionState] = useState<{
    status: TransactionStatus;
    transactionId?: string;
    failureReason?: string | null;
  } | null>(null);

  // QR Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Auto lookup phone when 10 digits entered
  useEffect(() => {
    let isMounted = true;
    if (recipientType === 'phone' && isValidPhone(phoneInput)) {
      setIsLookingUpPhone(true);
      userApi
        .getUserByPhone(phoneInput.trim())
        .then((foundUser) => {
          if (isMounted) {
            setUpiInput(foundUser.upiId);
            setRecipientName(foundUser.name || foundUser.displayName || 'Found Beneficiary');
            info(`Found beneficiary: ${foundUser.name} (${foundUser.upiId})`);
          }
        })
        .catch(() => {
          if (isMounted) {
            setRecipientName(null);
            setUpiInput(`${phoneInput.trim()}@paysim`);
          }
        })
        .finally(() => {
          if (isMounted) setIsLookingUpPhone(false);
        });
    } else if (recipientType === 'phone') {
      setRecipientName(null);
    }
    return () => {
      isMounted = false;
    };
  }, [phoneInput, recipientType]);

  const handleQrScanSuccess = (data: ParsedUpiData) => {
    setActiveTab('send');
    setRecipientType('upi');
    setUpiInput(data.upiId);
    if (data.name) setRecipientName(data.name);
    if (data.amount && data.amount > 0) setAmount(data.amount.toString());
    success(`Beneficiary loaded from QR: ${data.upiId}`);
  };

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();

    const targetUpi = upiInput.trim();
    const numAmount = parseFloat(amount);

    if (!targetUpi || !isValidUpiId(targetUpi)) {
      error('Please specify a valid beneficiary UPI ID (e.g. user@paysim)');
      return;
    }

    if (!numAmount || numAmount <= 0) {
      error('Please specify a valid payment amount greater than ₹0.00');
      return;
    }

    if (user?.upiId && targetUpi.toLowerCase() === user.upiId.toLowerCase()) {
      error('Cannot transfer money to your own UPI ID');
      return;
    }

    // Open PIN confirmation modal
    setPin('');
    setIsPinModalOpen(true);
  };

  const handleProcessPayment = async (enteredPin: string) => {
    if (!user?.upiId) return;

    setIsSubmitting(true);
    setIsPinModalOpen(false);

    // Initial lifecycle step: INITIATED
    setExecutionState({
      status: 'INITIATED',
    });

    try {
      // Step to PROCESSING after brief network transit
      setTimeout(() => {
        setExecutionState((prev) => (prev ? { ...prev, status: 'PROCESSING' } : null));
      }, 300);

      const numAmount = parseFloat(amount);
      const result = await paymentApi.sendMoney(
        {
          fromUpi: user.upiId,
          toUpi: upiInput.trim(),
          amount: numAmount,
          pin: enteredPin,
        },
        idempotencyKey
      );

      const finalStatus = (result.status || 'SUCCESS').toUpperCase() as TransactionStatus;

      setExecutionState({
        status: finalStatus,
        transactionId: result.transactionId,
        failureReason: finalStatus === 'FAILED' ? result.message || 'Payment execution failed' : null,
      });

      if (finalStatus === 'SUCCESS') {
        success('Payment executed successfully!');
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // Silent
        }
      } else {
        error(result.message || 'Payment failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction processing failed';
      setExecutionState({
        status: 'FAILED',
        failureReason: msg,
      });
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setExecutionState(null);
    setAmount('');
    setPhoneInput('');
    setUpiInput('');
    setRecipientName(null);
    setIdempotencyKey(generateIdempotencyKey());
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 rounded-xl bg-slate-900 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('send')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'send'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="h-4 w-4" />
            <span>Send Money</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('receive')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'receive'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>My QR Code</span>
          </button>
        </div>

        {activeTab === 'send' && (
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
          >
            <Scan className="h-4 w-4 text-brand-400" />
            <span>Scan QR Code</span>
          </button>
        )}
      </div>

      {/* Tab: Send Money */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* If currently showing execution state */}
            {executionState ? (
              <div className="space-y-6">
                <PaymentStepper
                  currentStatus={executionState.status}
                  transactionId={executionState.transactionId}
                  amount={parseFloat(amount)}
                  receiverUpi={upiInput}
                  failureReason={executionState.failureReason}
                />

                <div className="flex flex-wrap items-center gap-3">
                  {executionState.status === 'SUCCESS' && executionState.transactionId && (
                    <button
                      type="button"
                      onClick={() => navigate(`/receipts/${executionState.transactionId}`)}
                      className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-500 transition-all"
                    >
                      <Receipt className="h-4 w-4" />
                      <span>View Receipt</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
                  >
                    Send Another Payment
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
                <div className="pb-4 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Create Payment
                  </h3>
                </div>

                <form onSubmit={handleStartPayment} className="mt-5 space-y-5">
                  {/* Recipient Mode Selector */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-2">
                      Recipient Type
                    </label>
                    <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1">
                      <button
                        type="button"
                        onClick={() => setRecipientType('upi')}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                          recipientType === 'upi'
                            ? 'bg-slate-800 text-white font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        UPI ID
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientType('phone')}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                          recipientType === 'phone'
                            ? 'bg-slate-800 text-white font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Phone Number
                      </button>
                    </div>
                  </div>

                  {/* Recipient Inputs */}
                  {recipientType === 'phone' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                        Recipient Mobile Number
                      </label>
                      <div className="mt-1.5 flex rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden focus-within:border-brand-500 transition-colors">
                        <span className="flex items-center bg-slate-900 px-3 text-xs font-mono text-slate-400 border-r border-slate-800">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="9876543210"
                          className="w-full bg-transparent px-3 py-2.5 text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none"
                        />
                      </div>
                      {isLookingUpPhone && (
                        <p className="mt-1.5 text-xs text-brand-400 font-mono flex items-center gap-1.5">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>Searching registered accounts...</span>
                        </p>
                      )}
                      {recipientName && (
                        <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-950/30 border border-emerald-900/40 p-2.5 text-xs text-emerald-300">
                          <UserCheck className="h-4 w-4" />
                          <span>Verified: <strong>{recipientName}</strong> ({upiInput})</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                          Recipient UPI ID
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsScannerOpen(true)}
                          className="text-[11px] font-semibold text-brand-400 hover:underline"
                        >
                          Scan QR
                        </button>
                      </div>
                      <input
                        type="text"
                        value={upiInput}
                        onChange={(e) => setUpiInput(e.target.value.trim())}
                        placeholder="e.g. name@paysim"
                        required
                        className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
                      />
                    </div>
                  )}

                  {/* Amount Input with Preset Chips */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                      Transfer Amount (₹)
                    </label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3.5 top-2.5 text-lg font-mono font-bold text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-3.5 py-2.5 text-lg font-mono font-bold text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
                      />
                    </div>

                    {/* Chips */}
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {[100, 500, 1000, 2000, 5000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAmount(amt.toString())}
                          className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-mono font-medium text-slate-300 hover:border-brand-500 hover:text-white transition-all"
                        >
                          +₹{amt.toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Idempotency Key Feature Card */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-brand-400" />
                        <span className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wide">
                          Idempotency Key
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextKey = generateIdempotencyKey();
                          setIdempotencyKey(nextKey);
                          info('Regenerated idempotency key');
                        }}
                        className="text-[11px] text-brand-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Regenerate</span>
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                      Ensures network retries do not result in duplicate transactions.
                    </p>
                    <div className="mt-2 truncate rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-mono text-slate-300">
                      {idempotencyKey}
                    </div>
                  </div>

                  {/* Submit Action */}
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:bg-brand-500 active:scale-[0.99] transition-all"
                  >
                    <span>Proceed to Pay</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Information Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
              <h4 className="text-sm font-bold text-white tracking-tight">
                Transfer Details
              </h4>

              <div className="mt-4 space-y-3 font-mono text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[10px] text-slate-500 uppercase">Debited Account</span>
                  <div className="text-slate-200 mt-0.5 truncate">{user?.upiId}</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[10px] text-slate-500 uppercase">Payment Method</span>
                  <div className="text-slate-200 mt-0.5">UPI Instant Transfer</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[10px] text-slate-500 uppercase">Currency</span>
                  <div className="text-slate-200 mt-0.5">INR (₹)</div>
                </div>
              </div>
            </div>

            {/* Quick QR Receive preview */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center">
              <QrCode className="h-8 w-8 text-brand-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white">Receive Money</h4>
              <p className="mt-1 text-xs text-slate-400">
                Show your QR code or share your UPI ID with others.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('receive')}
                className="mt-4 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
              >
                View QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Receive via QR */}
      {activeTab === 'receive' && (
        <div className="flex justify-center py-4">
          <div className="w-full max-w-md">
            <MyQrCard />
          </div>
        </div>
      )}

      {/* UPI PIN Modal */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title="Enter UPI PIN"
        description={`Authorizing payment of ${formatCurrency(amount)} to ${upiInput}`}
        maxWidth="sm"
      >
        <PinKeypad
          value={pin}
          onChange={(newPin) => setPin(newPin)}
          onSubmit={handleProcessPayment}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQrScanSuccess}
      />
    </div>
  );
};
