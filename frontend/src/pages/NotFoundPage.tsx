import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, FileQuestion } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center font-sans">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-brand-400 mb-4 shadow-xl">
        <FileQuestion className="h-8 w-8" />
      </div>

      <h1 className="text-3xl font-extrabold text-white tracking-tight">404</h1>
      <h2 className="mt-1 text-lg font-semibold text-slate-200">
        Endpoint or Route Not Found
      </h2>
      <p className="mt-2 text-xs text-slate-400 font-mono max-w-sm">
        The requested URL does not match any active client routes or simulated resources.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Go Back</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-500 shadow-lg shadow-brand-500/20 transition-all"
        >
          <Home className="h-4 w-4" />
          <span>Dashboard</span>
        </button>
      </div>
    </div>
  );
};
