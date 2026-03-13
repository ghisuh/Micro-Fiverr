"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number | null;
}

interface Gig {
  id: string;
  slug: string;
  title: string;
  price: number;
  user: { id: string; name: string | null; email: string | null };
  packages: Package[];
}

function CheckoutContent() {
  const router = useRouter();
  const search = useSearchParams();
  const slug = search.get("gig") || "";
  const packageId = search.get("package") || "";
  const { status } = useSession();

  const [gig, setGig] = useState<Gig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const selectedPackage = useMemo(() => {
    if (!gig) return null;
    if (packageId) return gig.packages.find((p) => p.id === packageId) || gig.packages[0] || null;
    return gig.packages[0] || null;
  }, [gig, packageId]);

  const serviceFee = useMemo(() => {
    if (!gig) return 0;
    const base = selectedPackage?.price ?? gig.price ?? 0;
    return Math.max(5, Math.round(base * 0.08));
  }, [gig, selectedPackage]);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/gigs/${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error("Failed to load gig");
        const data = await res.json();
        if (active) setGig(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load gig");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-3 text-center">
          <p className="text-slate-800 font-medium">No gig selected.</p>
          <Link className="text-slate-900 font-semibold hover:underline" href="/gigs">
            Go back to gigs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Checkout</h1>

        {loading && <p className="text-slate-700">Loading gig...</p>}
        {error && (
          <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        {gig && selectedPackage && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 space-y-5">
            <div className="space-y-1">
              <p className="text-sm text-slate-600">You are ordering</p>
              <h2 className="text-xl font-semibold text-slate-900">{gig.title}</h2>
              <p className="text-sm text-slate-600">from {gig.user?.name || gig.user?.email}</p>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900">{selectedPackage.name}</div>
                <div className="text-slate-900 font-semibold">${selectedPackage.price}</div>
              </div>
              <p className="text-sm text-slate-700">{selectedPackage.description}</p>
              <p className="text-xs text-slate-600">
                {selectedPackage.deliveryDays} day delivery · {selectedPackage.revisions ?? 0} revisions
              </p>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-900">
                <span>Package</span>
                <span>${selectedPackage.price}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-900">
                <span>Service fee</span>
                <span>${serviceFee}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between font-semibold text-slate-900">
                <span>Total</span>
                <span>${selectedPackage.price + serviceFee}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {status !== "authenticated" ? (
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/checkout?gig=${slug}&package=${selectedPackage.id}`)}`}
                  className="rounded-md bg-slate-900 px-4 py-2 text-white font-medium hover:bg-slate-800"
                >
                  Log in to continue
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={placing}
                  className="rounded-md bg-slate-900 px-4 py-2 text-white font-medium hover:bg-slate-800 disabled:opacity-60"
                  onClick={async () => {
                    if (!gig || !selectedPackage) return;
                    setPlacing(true);
                    setError(null);
                    try {
                      const res = await fetch("/api/orders", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          gigId: gig.id,
                          packageId: selectedPackage.id,
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        throw new Error(data?.error || "Failed to create order");
                      }
                      router.push(`/orders/${data.id}`);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Failed to create order");
                    } finally {
                      setPlacing(false);
                    }
                  }}
                >
                  {placing ? "Creating order..." : "Create order"}
                </button>
              )}
              <Link
                href={`/gigs/${encodeURIComponent(slug)}`}
                className="rounded-md border border-slate-300 px-4 py-2 text-slate-900 font-medium hover:border-slate-400"
              >
                Back to gig
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 px-4 py-10 flex items-center justify-center">
          <p className="text-slate-700">Loading checkout...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
