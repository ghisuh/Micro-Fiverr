import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id: String(orderId) },
      select: { id: true, buyerId: true, sellerId: true, paidAt: true, status: true },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.buyerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (order.paidAt) return NextResponse.json(order);

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { paidAt: new Date() },
      select: { id: true, paidAt: true, status: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
