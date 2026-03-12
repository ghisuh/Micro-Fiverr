import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  _req: Request,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const messages = await prisma.orderMessage.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json(messages);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const text = String(body?.text || "").trim();
    const attachmentUrl = body?.attachmentUrl ? String(body.attachmentUrl).trim() : null;
    if (!text && !attachmentUrl) {
      return NextResponse.json({ error: "Message text or attachment is required" }, { status: 400 });
    }

    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, buyerId: true, sellerId: true },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const userId = session.user.id;
    if (order.buyerId !== userId && order.sellerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await prisma.orderMessage.create({
      data: {
        text,
        attachmentUrl,
        orderId: order.id,
        senderId: userId,
      },
      include: { sender: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to post message" }, { status: 500 });
  }
}
