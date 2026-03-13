import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

async function generateUniqueSlug(title: string) {
  const base = slugify(title) || "gig";
  let attempt = base;
  let suffix = 0;

  // loop until unique, but cap attempts
  while (suffix < 10) {
    const exists = await prisma.gig.findUnique({ where: { slug: attempt } });
    if (!exists) return attempt;
    suffix += 1;
    attempt = `${base}-${suffix}`;
  }

  // last resort: append random tail
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim().toLowerCase() || "";
    const tag = url.searchParams.get("tag")?.trim().toLowerCase() || "";
    const rawMin = url.searchParams.get("minPrice");
    const rawMax = url.searchParams.get("maxPrice");
    const rawDelivery = url.searchParams.get("deliveryDays");
    const minPrice = rawMin ? Number(rawMin) : null;
    const maxPrice = rawMax ? Number(rawMax) : null;
    const deliveryDays = rawDelivery ? Number(rawDelivery) : null;
    const sort = url.searchParams.get("sort") || "new";
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSize = 12;

    const where: Prisma.GigWhereInput = {};
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }
    if (tag) {
      where.tags = { has: tag };
    }
    if (minPrice !== null || maxPrice !== null) {
      where.price = {};
      if (minPrice !== null && Number.isFinite(minPrice))
        where.price.gte = Math.max(0, Math.floor(minPrice));
      if (maxPrice !== null && Number.isFinite(maxPrice))
        where.price.lte = Math.max(0, Math.floor(maxPrice));
    }
    if (Number.isFinite(deliveryDays)) {
      const deliveryDaysValue = Math.max(1, Math.floor(deliveryDays as number));
      where.packages = {
        some: { deliveryDays: { lte: deliveryDaysValue } },
      };
    }

    let orderBy: Prisma.GigOrderByWithRelationInput;
    if (sort === "price_asc") {
      orderBy = { price: "asc" };
    } else if (sort === "price_desc") {
      orderBy = { price: "desc" };
    } else {
      orderBy = { createdAt: "desc" };
    }

    const [gigs, total] = await Promise.all([
      prisma.gig.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          packages: true,
          reviews: { select: { rating: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.gig.count({ where }),
    ]);

    return NextResponse.json({ items: gigs, total, page, pageSize });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load gigs." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();

    const gallery = Array.isArray(body.gallery)
      ? body.gallery.map((url: unknown) => String(url || "").trim()).filter(Boolean).slice(0, 8)
      : [];

    const tags = Array.isArray(body.tags)
      ? body.tags.map((t: unknown) => String(t || "").trim().toLowerCase()).filter(Boolean).slice(0, 8)
      : [];

    const faqs = Array.isArray(body.faqs)
      ? body.faqs
          .map((f: unknown) => {
            const item = f as { question?: unknown; answer?: unknown };
            return {
              question: item?.question ? String(item.question).trim() : "",
              answer: item?.answer ? String(item.answer).trim() : "",
            };
          })
          .filter((f: { question: string; answer: string }) => f.question && f.answer)
      : [];

    const packagesInput = Array.isArray(body.packages) ? body.packages : [];
    const packages = packagesInput
      .map((p: unknown, idx: number) => {
        const pkg = p as {
          name?: unknown;
          description?: unknown;
          price?: unknown;
          deliveryDays?: unknown;
          revisions?: unknown;
        };
        return {
          name: String(pkg?.name || ["Basic", "Standard", "Premium"][idx] || "Package").trim(),
          description: String(pkg?.description || "").trim(),
          price: Number(pkg?.price),
          deliveryDays: Number(pkg?.deliveryDays),
          revisions: pkg?.revisions != null ? Number(pkg.revisions) : null,
        };
      })
      .filter(
        (p) =>
          p.name &&
          p.description &&
          Number.isFinite(p.price) &&
          Number.isFinite(p.deliveryDays) &&
          p.price > 0 &&
          p.deliveryDays > 0
      );

    const priceValue = Number(body.price);
    const singlePrice = Number.isFinite(priceValue) ? Math.round(priceValue) : NaN;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required." },
        { status: 400 }
      );
    }

    if (!packages.length && Number.isNaN(singlePrice)) {
      return NextResponse.json(
        { error: "Provide either packages or a base price." },
        { status: 400 }
      );
    }

    const price = packages.length ? Math.min(...packages.map((p) => p.price)) : singlePrice;

    if (price < 1) {
      return NextResponse.json(
        { error: "Price must be at least 1." },
        { status: 400 }
      );
    }

    const slug = await generateUniqueSlug(title);

    const gig = await prisma.gig.create({
      data: {
        title,
        description,
        slug,
        price,
        gallery,
        tags,
        faqs: faqs.length ? faqs : null,
        userId,
        packages: packages.length
          ? {
              create: packages.map((p) => ({
                name: p.name,
                description: p.description,
                price: Math.round(p.price),
                deliveryDays: Math.round(p.deliveryDays),
                revisions: p.revisions != null ? Math.round(p.revisions) : null,
              })),
            }
          : undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        packages: true,
      },
    });

    return NextResponse.json(gig, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create gig." }, { status: 500 });
  }
}
