import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const role = url.searchParams.get("role") || "all"; // buyer | seller | all

    const where =
      role === "buyer"
        ? { buyerId: userId }
        : role === "seller"
        ? { sellerId: userId }
        : { OR: [{ buyerId: userId }, { sellerId: userId }] };

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        price: true,
        createdAt: true,
        buyerId: true,
        sellerId: true,
        paidAt: true,
        gig: { select: { id: true, title: true, slug: true, userId: true } },
        package: { select: { id: true, name: true, price: true, deliveryDays: true, revisions: true } },
      },
    });

    return NextResponse.json(orders);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const gigId = String(body.gigId || "").trim();
    const packageId = body.packageId ? String(body.packageId).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : undefined;

    if (!gigId) {
      return NextResponse.json({ error: "gigId is required" }, { status: 400 });
    }

    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      include: { packages: true, user: { select: { id: true } } },
    });

    if (!gig) {
      return NextResponse.json({ error: "Gig not found" }, { status: 404 });
    }

    let selectedPackage = null;
    if (packageId) {
      selectedPackage = gig.packages.find((p) => p.id === packageId) || null;
      if (!selectedPackage) {
        return NextResponse.json({ error: "Package not found for this gig" }, { status: 400 });
      }
    }

    const price = selectedPackage ? selectedPackage.price : gig.price;

    const order = await prisma.order.create({
      data: {
        status: "PENDING",
        price,
        notes,
        gigId: gig.id,
        packageId: selectedPackage ? selectedPackage.id : null,
        buyerId: userId,
        sellerId: gig.user.id,
        paidAt: null,
      },
      include: {
        gig: { select: { id: true, title: true, slug: true } },
        package: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error(err);
    const code = (err as { code?: string } | undefined)?.code;
    if (code === "P2021") {
      return NextResponse.json(
        { error: "Orders table is missing. Run `npx prisma migrate dev --name orders` and restart the server." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
