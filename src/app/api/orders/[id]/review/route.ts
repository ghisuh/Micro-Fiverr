import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  req: Request,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json();
    const rating = Number(body?.rating);
    const comment = String(body?.comment || "").trim();

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, buyerId: true, sellerId: true, gigId: true },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.buyerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (order.status !== "COMPLETED") {
      return NextResponse.json({ error: "Order must be completed to review" }, { status: 400 });
    }

    const existing = await prisma.review.findFirst({ where: { orderId: order.id, userId: session.user.id } });
    if (existing) {
      return NextResponse.json({ error: "Review already submitted" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        rating: Math.round(rating),
        comment,
        gigId: order.gigId,
        userId: session.user.id,
        orderId: order.id,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
