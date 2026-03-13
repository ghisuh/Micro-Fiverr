export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-3 text-center">
        <p className="text-sm uppercase tracking-wide text-slate-500">404</p>
        <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
        <p className="text-slate-600">The page you’re looking for doesn’t exist.</p>
        <a
          href="/"
          className="inline-flex justify-center rounded-md bg-slate-900 px-4 py-2 text-white font-medium hover:bg-slate-800 transition"
        >
          Back home
        </a>
      </div>
    </div>
  );
}
