import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { OrderStatus } from "@prisma/client";

type Action = "start" | "deliver" | "accept" | "cancel";

const allowedTransitions: Record<Action, { from: OrderStatus[]; to: OrderStatus; role: "buyer" | "seller" | "either" }> = {
  start: { from: [OrderStatus.PENDING], to: OrderStatus.ACTIVE, role: "seller" },
  deliver: { from: [OrderStatus.ACTIVE], to: OrderStatus.DELIVERED, role: "seller" },
  accept: { from: [OrderStatus.DELIVERED], to: OrderStatus.COMPLETED, role: "buyer" },
  cancel: { from: [OrderStatus.PENDING, OrderStatus.ACTIVE], to: OrderStatus.CANCELLED, role: "either" },
};

export async function PATCH(
  req: Request,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = (await req.json()) as { action?: Action };
    if (!action || !(action in allowedTransitions)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, buyerId: true, sellerId: true, paidAt: true },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const userId = session.user.id;
    const { from, to, role } = allowedTransitions[action];

    const isBuyer = order.buyerId === userId;
    const isSeller = order.sellerId === userId;

    if (role === "buyer" && !isBuyer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (role === "seller" && !isSeller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (role === "either" && !isBuyer && !isSeller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (!from.includes(order.status)) {
      return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
    }

    if (!order.paidAt && (action === "start" || action === "deliver" || action === "accept")) {
      return NextResponse.json({ error: "Order must be paid before this action." }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: to },
      include: {
        gig: { select: { id: true, title: true, slug: true } },
        package: true,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
