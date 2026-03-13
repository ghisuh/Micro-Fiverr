"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Message {
  id: string;
  text: string;
  createdAt: string;
  sender: { id: string; name: string | null; email: string | null };
  attachmentUrl?: string | null;
}

interface Props {
  orderId: string;
  initialStatus: string;
  isBuyer: boolean;
  isSeller: boolean;
  isPaid: boolean;
  existingReview?: { rating: number; comment: string | null } | null;
}

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  ACTIVE: "Active",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function OrderClient({
  orderId,
  initialStatus,
  isBuyer,
  isSeller,
  isPaid,
  existingReview,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [paid, setPaid] = useState(isPaid);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(existingReview?.rating ?? 5);
  const [reviewComment, setReviewComment] = useState(existingReview?.comment ?? "");
  const [reviewDone, setReviewDone] = useState(!!existingReview);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchMessages();
    const t = setInterval(fetchMessages, 8000);
    return () => clearInterval(t);
  }, [fetchMessages]);

  const sendMessage = async () => {
    const body = text.trim();
    const attachmentUrl = attachment.trim();
    if (!body && !attachmentUrl) return;
    setSending(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body, attachmentUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data]);
        setText("");
        setAttachment("");
      }
    } finally {
      setSending(false);
    }
  };

  const callAction = async (action: string) => {
    setActionError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update");
      setStatus(data.status);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const payNow = async () => {
    setActionError(null);
    try {
      const res = await fetch("/api/orders/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Payment failed");
      setPaid(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Payment failed");
    }
  };

  const submitReview = async () => {
    setActionError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit review");
      setReviewDone(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to submit review");
    }
  };

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
          {actionError}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {isBuyer && !paid && (
          <button
            onClick={payNow}
            className="rounded-md bg-emerald-600 px-3 py-2 text-white text-sm font-medium hover:bg-emerald-500"
          >
            Pay now
          </button>
        )}
        {isSeller && status === "PENDING" && paid && (
          <button
            onClick={() => callAction("start")}
            className="rounded-md bg-slate-900 px-3 py-2 text-white text-sm font-medium hover:bg-slate-800"
          >
            Start order
          </button>
        )}
        {isSeller && status === "ACTIVE" && paid && (
          <button
            onClick={() => callAction("deliver")}
            className="rounded-md bg-slate-900 px-3 py-2 text-white text-sm font-medium hover:bg-slate-800"
          >
            Mark delivered
          </button>
        )}
        {isBuyer && status === "DELIVERED" && paid && (
          <button
            onClick={() => callAction("accept")}
            className="rounded-md bg-emerald-600 px-3 py-2 text-white text-sm font-medium hover:bg-emerald-500"
          >
            Accept delivery
          </button>
        )}
        {(isBuyer || isSeller) && ["PENDING", "ACTIVE"].includes(status) && (
          <button
            onClick={() => callAction("cancel")}
            className="rounded-md bg-rose-600 px-3 py-2 text-white text-sm font-medium hover:bg-rose-500"
          >
            Cancel order
          </button>
        )}
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
          Status: {statusLabel[status] || status}
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
          {paid ? "Paid" : "Unpaid"}
        </span>
        <Link href="/orders" className="text-sm font-medium text-slate-700 hover:underline">
          Back to orders
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Messages</h3>
          {loading && <span className="text-xs text-slate-500">Refreshing...</span>}
        </div>
        <div className="max-h-80 overflow-y-auto space-y-3">
          {loading && messages.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-1">
                  <div className="h-3 w-32 bg-slate-200 rounded" />
                  <div className="h-4 w-64 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-slate-600">No messages yet.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{m.sender?.name || m.sender?.email || "User"}</span>
                  <span>{new Date(m.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-800">{m.text}</p>
                {m.attachmentUrl && (
                  <a
                    href={m.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-slate-900 underline"
                  >
                    Attachment
                  </a>
                )}
              </div>
            ))
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <input
            value={attachment}
            onChange={(e) => setAttachment(e.target.value)}
            placeholder="Attachment URL (optional)"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <button
            disabled={sending || (!text.trim() && !attachment.trim())}
            onClick={sendMessage}
            className="rounded-md bg-slate-900 px-3 py-2 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </div>

      {isBuyer && status === "COMPLETED" && !reviewDone && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Leave a review</h3>
          <div className="space-y-2">
            <p className="text-sm text-slate-700">Rating</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReviewRating(r)}
                  className={`h-10 w-10 rounded-full border text-sm font-semibold transition ${
                    reviewRating === r
                      ? "bg-yellow-400 text-yellow-900 border-yellow-500 shadow-sm"
                      : "border-slate-300 text-slate-900 bg-white hover:border-slate-400"
                  }`}
                  aria-label={`Rate ${r} star${r > 1 ? "s" : ""}`}
                >
                  {r}★
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Share your experience"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            rows={3}
          />
          <button
            onClick={submitReview}
            className="rounded-md bg-slate-900 px-4 py-2 text-white text-sm font-medium hover:bg-slate-800"
          >
            Submit review
          </button>
        </div>
      )}
    </div>
  );
}
