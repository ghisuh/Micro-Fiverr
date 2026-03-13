"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-3 text-center">
        <p className="text-sm uppercase tracking-wide text-amber-600">Error</p>
        <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="text-slate-600">Please retry. If it persists, try refreshing the page.</p>
        <div className="flex justify-center gap-2">
          <button
            onClick={reset}
            className="rounded-md bg-slate-900 px-4 py-2 text-white font-medium hover:bg-slate-800 transition"
          >
            Retry
          </button>
          <a
            href="/"
            className="rounded-md border border-slate-300 px-4 py-2 text-slate-900 font-medium hover:border-slate-400 hover:bg-slate-50 transition"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
