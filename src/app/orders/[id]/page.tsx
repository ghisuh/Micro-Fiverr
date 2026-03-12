import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import OrderClient from "./OrderClient";

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  ACTIVE: "Active",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default async function OrderDetail({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      gig: { select: { id: true, title: true, slug: true, userId: true } },
      package: true,
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  });

  if (!order) return notFound();

  if (session?.user?.id && order.buyerId !== session.user.id && order.sellerId !== session.user.id) {
    return notFound();
  }

  const existingReview =
    session?.user?.id
      ? await prisma.review.findFirst({
          where: { orderId: order.id, userId: session.user.id },
          select: { rating: true, comment: true },
        })
      : null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Order #{order.id.slice(0, 8)}</h1>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
            {statusLabel[order.status] || order.status}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div>
            <p className="text-sm text-slate-600">Gig</p>
            <p className="text-lg font-semibold text-slate-900">{order.gig.title}</p>
          </div>
          {order.package ? (
            <div className="space-y-1">
              <p className="text-sm text-slate-600">Package</p>
              <p className="font-semibold text-slate-900">{order.package.name}</p>
              <p className="text-sm text-slate-700">{order.package.description}</p>
            </div>
          ) : null}
          <div className="text-lg font-semibold text-slate-900">${order.price}</div>
          <div className="text-sm text-slate-600">
            Payment: {order.paidAt ? `Paid on ${new Date(order.paidAt).toLocaleString()}` : "Unpaid"}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">Buyer</p>
            <p className="font-semibold text-slate-900">{order.buyer.name || order.buyer.email}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">Seller</p>
            <p className="font-semibold text-slate-900">{order.seller.name || order.seller.email}</p>
          </div>
        </div>

        {order.notes ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">Notes</p>
            <p className="text-slate-800 whitespace-pre-line">{order.notes}</p>
          </div>
        ) : null}

        <OrderClient
          orderId={order.id}
          initialStatus={order.status}
          isBuyer={!!session?.user?.id && session.user.id === order.buyerId}
          isSeller={!!session?.user?.id && session.user.id === order.sellerId}
          isPaid={!!order.paidAt}
          existingReview={existingReview}
        />
      </div>
    </div>
  );
}
