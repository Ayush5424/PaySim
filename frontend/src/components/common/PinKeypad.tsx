import React, { useState, useEffect } from 'react';
import { Delete, Check } from 'lucide-react';

interface PinKeypadProps {
  pinLength?: number;
  value: string;
  onChange: (pin: string) => void;
  onSubmit: (pin: string) => void;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
}

export const PinKeypad: React.FC<PinKeypadProps> = ({
  pinLength = 4,
  value,
  onChange,
  onSubmit,
  isLoading = false,
  title = 'Enter UPI PIN',
  subtitle = '4 to 6 digit security PIN',
}) => {
  const [localPin, setLocalPin] = useState(value);

  useEffect(() => {
    setLocalPin(value);
  }, [value]);

  const handleKey = (key: string) => {
    if (isLoading) return;
    if (key === 'backspace') {
      const next = localPin.slice(0, -1);
      setLocalPin(next);
      onChange(next);
    } else if (key === 'submit') {
      if (localPin.length >= 4) {
        onSubmit(localPin);
      }
    } else if (localPin.length < 6) {
      const next = localPin + key;
      setLocalPin(next);
      onChange(next);
    }
  };

  // Keyboard support for typing PIN
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;
      if (e.key >= '0' && e.key <= '9') {
        if (localPin.length < 6) {
          const next = localPin + e.key;
          setLocalPin(next);
          onChange(next);
        }
      } else if (e.key === 'Backspace') {
        const next = localPin.slice(0, -1);
        setLocalPin(next);
        onChange(next);
      } else if (e.key === 'Enter') {
        if (localPin.length >= 4) {
          onSubmit(localPin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localPin, isLoading, onChange, onSubmit]);

  const displayLength = Math.max(pinLength, localPin.length > 4 ? 6 : 4);

  return (
    <div className="flex flex-col items-center">
      {title && <h4 className="text-sm font-semibold text-slate-200">{title}</h4>}
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}

      {/* Masked Pin Dots */}
      <div className="flex items-center gap-3 my-6">
        {Array.from({ length: displayLength }).map((_, index) => {
          const isFilled = index < localPin.length;
          return (
            <div
              key={index}
              className={`h-4 w-4 rounded-full border transition-all duration-150 ${
                isFilled
                  ? 'bg-brand-500 border-brand-400 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                  : 'bg-slate-800 border-slate-700'
              }`}
            />
          );
        })}
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={isLoading}
            onClick={() => handleKey(digit)}
            className="flex h-12 items-center justify-center rounded-xl bg-slate-800/80 text-lg font-mono font-semibold text-white border border-slate-700/60 hover:bg-slate-700/80 active:scale-95 transition-all disabled:opacity-50"
          >
            {digit}
          </button>
        ))}

        {/* Backspace */}
        <button
          type="button"
          disabled={isLoading || localPin.length === 0}
          onClick={() => handleKey('backspace')}
          className="flex h-12 items-center justify-center rounded-xl bg-slate-800/40 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white active:scale-95 transition-all disabled:opacity-30"
          title="Backspace"
        >
          <Delete className="h-5 w-5" />
        </button>

        {/* 0 */}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleKey('0')}
          className="flex h-12 items-center justify-center rounded-xl bg-slate-800/80 text-lg font-mono font-semibold text-white border border-slate-700/60 hover:bg-slate-700/80 active:scale-95 transition-all disabled:opacity-50"
        >
          0
        </button>

        {/* Submit */}
        <button
          type="button"
          disabled={isLoading || localPin.length < 4}
          onClick={() => handleKey('submit')}
          className="flex h-12 items-center justify-center rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-500 active:scale-95 transition-all disabled:opacity-30 shadow-lg shadow-brand-500/20"
          title="Submit PIN"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Check className="h-5 w-5 stroke-[2.5]" />
          )}
        </button>
      </div>
    </div>
  );
};
