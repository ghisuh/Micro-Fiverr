import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: { slug: string } } | { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await (context.params as Promise<{ slug: string }>);
    const slugValue = typeof slug === "string" ? decodeURIComponent(slug) : "";

    if (!slugValue) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    const gig = await prisma.gig.findUnique({
      where: { slug: slugValue },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        packages: true,
        reviews: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!gig) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(gig);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load gig." },
      { status: 500 }
    );
  }
}
