"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type Role = "all" | "buyer" | "seller";

interface Order {
  id: string;
  status: string;
  price: number;
  createdAt: string;
  buyerId: string;
  sellerId: string;
  paidAt?: string | null;
  gig: { id: string; title: string; slug: string; userId: string };
  package?: { id: string; name: string; price: number; deliveryDays: number; revisions: number | null } | null;
}

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  ACTIVE: "Active",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function OrdersPage() {
  const { status, data: session } = useSession();
  const [role, setRole] = useState<Role>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(
    async (targetRole: Role = role) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/orders?role=${targetRole}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load orders");
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load orders");
      } finally {
        setLoading(false);
      }
    },
    [role]
  );

  useEffect(() => {
    if (status === "authenticated") fetchOrders();
  }, [status, fetchOrders]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
            <p className="text-slate-600 text-sm">View orders as buyer or seller.</p>
          </div>
          <div className="flex gap-2">
            {["all", "buyer", "seller"].map((r) => (
              <button
                key={r}
                onClick={() => {
                  const val = r as Role;
                  setRole(val);
                  fetchOrders(val);
                }}
                className={`rounded-md border px-3 py-1 text-sm font-medium ${
                  role === r
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-300 text-slate-800 bg-white hover:border-slate-400"
                }`}
              >
                {(r === "all" && "All") || (r === "buyer" && "As buyer") || "As seller"}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="text-slate-700">Loading...</p>}
        {error && (
          <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-slate-600">
              No orders yet. Once you buy or sell, they’ll appear here.
            </div>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-slate-600">{new Date(order.createdAt).toLocaleString()}</div>
                    <div className="text-lg font-semibold text-slate-900">{order.gig?.title}</div>
                    {order.package ? (
                      <div className="text-sm text-slate-700">Package: {order.package.name}</div>
                    ) : null}
                    {session?.user ? (
                      <div className="text-xs text-slate-500">
                        Role:{" "}
                        {(() => {
                          const userId = (session.user as { id?: string })?.id;
                          if (!userId) return "Viewer";
                          if (order.buyerId === userId && order.sellerId === userId) return "Buyer & Seller";
                          if (order.buyerId === userId) return "Buyer";
                          if (order.sellerId === userId) return "Seller";
                          return "Viewer";
                        })()}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right space-y-1">
                    <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                      {statusLabel[order.status] || order.status}
                    </div>
                    <div className="text-xs text-slate-500">
                      {order.paidAt ? "Paid" : "Unpaid"}
                    </div>
                    <div className="text-lg font-semibold text-slate-900">${order.price}</div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
