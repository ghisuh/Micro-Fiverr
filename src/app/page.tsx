import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-5xl px-4 py-16 space-y-14">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full bg-slate-900 text-white px-4 py-1 text-sm font-medium shadow-sm">
              Micro-Fiverr
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-slate-900 leading-tight">
              A tiny marketplace for fast, quality work.
            </h1>
            <p className="text-lg text-slate-600 max-w-xl">
              Post gigs, hire talent, and get projects shipped quickly. Built with Next.js,
              Prisma, and NextAuth for a smooth, secure experience.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/gigs"
                className="rounded-md bg-slate-900 px-5 py-2.5 text-white font-medium hover:bg-slate-800 transition shadow-sm"
              >
                Browse Gigs
              </Link>
              <Link
                href="/gigs/implement-a-nextjs-api"
                className="rounded-md bg-emerald-600 px-5 py-2.5 text-white font-medium hover:bg-emerald-500 transition shadow-sm"
              >
                See sample gig
              </Link>
              <Link
                href="/signup"
                className="rounded-md border border-slate-300 px-5 py-2.5 text-slate-900 font-medium hover:border-slate-400 hover:bg-slate-50 transition"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-transparent px-5 py-2.5 text-slate-700 font-medium hover:text-slate-900 transition"
              >
                Log In
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Featured Gig</p>
                  <h3 className="text-xl font-semibold text-slate-900">Design a landing page</h3>
                </div>
                <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-sm font-medium">
                  $250
                </span>
              </div>
              <p className="text-slate-600">
                Clean, modern landing page with responsive layouts and fast turnaround. Includes Figma source and basic animations.
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-medium">
                  JD
                </div>
                <div>
                  <p className="font-medium text-slate-900">Jordan Diaz</p>
                  <p className="text-sm text-slate-600">Top Rated Seller</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm text-slate-600">
                <div className="rounded-lg bg-slate-50 py-2">2 day delivery</div>
                <div className="rounded-lg bg-slate-50 py-2">3 revisions</div>
                <div className="rounded-lg bg-slate-50 py-2">Figma + code</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {["Post gigs", "Hire talent", "Move fast"].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-2"
            >
              <h3 className="text-lg font-semibold text-slate-900">{item}</h3>
              <p className="text-sm text-slate-600">
                Micro-sized workflow for shipping projects without the bloat of big marketplaces.
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
