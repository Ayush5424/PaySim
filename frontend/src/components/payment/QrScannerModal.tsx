import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { parseUpiUri, ParsedUpiData } from '../../utils/qr';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: ParsedUpiData) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setScannerError(null);
      return;
    }

    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setScannerError(null);
    try {
      const element = document.getElementById('qr-camera-feed');
      if (!element) return;

      const html5QrCode = new Html5Qrcode('qr-camera-feed');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        () => {
          // Frame parse failure (normal when scanning)
        }
      );
      setIsScanning(true);
    } catch (err: unknown) {
      setIsScanning(false);
      setScannerError(
        'Camera access denied or unavailable. You can upload a QR image from your device.'
      );
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignored
      }
      setIsScanning(false);
      scannerRef.current = null;
    }
  };

  const handleDecodedText = (decodedText: string) => {
    const parsed = parseUpiUri(decodedText);
    if (parsed && parsed.upiId) {
      stopScanner();
      onScanSuccess(parsed);
      onClose();
    } else {
      setScannerError(`Invalid QR code format: "${decodedText.slice(0, 30)}..."`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannerError(null);
    try {
      const html5QrCode = new Html5Qrcode('qr-camera-feed-hidden');
      const decodedText = await html5QrCode.scanFile(file, true);
      handleDecodedText(decodedText);
    } catch {
      setScannerError('Could not find a valid UPI QR code in the uploaded image.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scan UPI QR Code"
      description="Scan any dynamic or static UPI QR code to populate payment recipient"
      maxWidth="md"
    >
      {/* Tabs */}
      <div className="flex rounded-lg bg-slate-950 p-1 mb-4 border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('camera')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all ${
            activeTab === 'camera'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="h-4 w-4" />
          Live Camera
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all ${
            activeTab === 'upload'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          Upload Image
        </button>
      </div>

      {scannerError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-900/40 bg-rose-950/20 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{scannerError}</span>
        </div>
      )}

      {/* Camera View */}
      {activeTab === 'camera' && (
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          <div id="qr-camera-feed" className="w-full min-h-[280px]" />
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            <div className="h-56 w-56 rounded-2xl border-2 border-brand-500/80 shadow-[0_0_20px_rgba(99,102,241,0.25)] relative">
              <div className="absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-brand-400" />
              <div className="absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-brand-400" />
              <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-brand-400" />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-brand-400" />
            </div>
          </div>
        </div>
      )}

      {/* Upload View */}
      {activeTab === 'upload' && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/40 p-8 text-center">
          <ImageIcon className="h-12 w-12 text-slate-500 mb-3" />
          <h4 className="text-sm font-semibold text-slate-200">
            Upload QR Image from Gallery
          </h4>
          <p className="mt-1 text-xs text-slate-400 max-w-xs">
            Supports PNG, JPG, or WEBP screenshots containing standard UPI QR codes
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="qr-file-upload-input"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 active:scale-95 transition-all shadow-lg shadow-brand-500/20"
          >
            Select Image
          </button>
        </div>
      )}

      {/* Hidden dummy container for image scanner */}
      <div id="qr-camera-feed-hidden" className="hidden" />
    </Modal>
  );
};
