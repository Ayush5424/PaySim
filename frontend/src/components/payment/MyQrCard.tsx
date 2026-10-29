import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, RefreshCw, QrCode as QrIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { paymentApi } from '../../api/paymentApi';
import { buildUpiUri } from '../../utils/qr';
import { useToast } from '../common/Toast';

export const MyQrCard: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const generateQr = async () => {
    if (!user?.upiId) return;
    setIsLoading(true);

    try {
      // First attempt backend QR payload
      const qrPayloadRes = await paymentApi.getQrPayload(user.upiId);
      const payload = qrPayloadRes?.payload || buildUpiUri(user.upiId, user.displayName || user.name);

      const url = await QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
    } catch {
      // Fallback to local URI generation
      try {
        const payload = buildUpiUri(user.upiId, user.displayName || user.name);
        const url = await QRCode.toDataURL(payload, {
          width: 320,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        setQrDataUrl(url);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to generate QR';
        error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateQr();
  }, [user?.upiId]);

  const handleDownload = () => {
    if (!qrDataUrl || !user?.upiId) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `paysim-qr-${user.upiId.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('QR Code image downloaded');
  };

  const handleCopyUpi = () => {
    if (!user?.upiId) return;
    navigator.clipboard.writeText(user.upiId);
    setCopied(true);
    success('UPI ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center backdrop-blur-md">
      <div className="flex items-center gap-2 mb-4">
        <QrIcon className="h-5 w-5 text-brand-400" />
        <h3 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
          UPI QR Code
        </h3>
      </div>

      {/* QR Display Frame */}
      <div className="relative flex h-64 w-64 items-center justify-center rounded-2xl border border-slate-700/60 bg-white p-3 shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 text-slate-600">
            <RefreshCw className="h-6 w-6 animate-spin text-brand-600" />
            <span className="text-xs font-mono font-medium">Generating QR code...</span>
          </div>
        ) : qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="UPI QR Code"
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-xs text-slate-500">Could not generate QR</span>
        )}
      </div>

      {/* User Info below QR */}
      <div className="mt-4">
        <h4 className="text-sm font-bold text-slate-100">
          {user?.displayName || user?.name || 'PaySim User'}
        </h4>
        <p className="text-xs font-mono text-slate-400 mt-0.5">{user?.upiId}</p>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex w-full max-w-xs items-center gap-2">
        <button
          type="button"
          onClick={handleCopyUpi}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all active:scale-95"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          Copy UPI
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={!qrDataUrl}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-500 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-brand-500/20"
        >
          <Download className="h-4 w-4" />
          Download
        </button>
      </div>
    </div>
  );
};
