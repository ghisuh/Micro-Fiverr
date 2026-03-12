import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";

export const revalidate = 0;

export default async function GigDetailPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const slugValue = typeof slug === "string" ? decodeURIComponent(slug) : "";
  if (!slugValue) return notFound();
  const session = await getServerSession(authOptions);
  const gig =
    (await prisma.gig.findUnique({
      where: { slug: slugValue },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        packages: { orderBy: { price: "asc" } },
        reviews: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    })) ||
    (await prisma.gig.findFirst({
      where: { OR: [{ slug: slugValue }, { id: slugValue }] },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        packages: { orderBy: { price: "asc" } },
        reviews: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }));

  if (!gig) return notFound();

  const primaryImage = gig.gallery?.[0];
  const tags = gig.tags || [];
  const faqs =
    Array.isArray(gig.faqs) && gig.faqs.length
      ? (gig.faqs as { question?: string; answer?: string }[]).filter(
          (f) => f?.question && f?.answer
        )
      : [];
  const avgRating =
    gig.reviews.length > 0
      ? gig.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / gig.reviews.length
      : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <div className="text-sm text-slate-600">{gig.user?.name || gig.user?.email}</div>
              <h1 className="text-3xl font-semibold text-slate-900">{gig.title}</h1>
              {avgRating && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">{avgRating.toFixed(1)} / 5</span>
                  <span>{"★".repeat(Math.round(avgRating)).padEnd(5, "☆")}</span>
                  <span className="text-slate-500">({gig.reviews.length} reviews)</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              {primaryImage ? (
                <Image src={primaryImage} alt={gig.title} className="w-full h-80 object-cover" width={1200} height={600} />
              ) : (
                <div className="w-full h-80 bg-gradient-to-br from-slate-100 to-slate-200" />
              )}
              {gig.gallery && gig.gallery.length > 1 ? (
                <div className="grid grid-cols-3 gap-1 p-2 bg-slate-50">
                  {gig.gallery.slice(1, 7).map((img) => (
                    <Image
                      key={img}
                      src={img}
                      alt="Gallery"
                      className="h-24 w-full object-cover rounded-md border border-slate-200"
                      width={400}
                      height={160}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">About this gig</h2>
              <p className="text-slate-700 whitespace-pre-line">{gig.description}</p>
            </div>

            <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">FAQs</h3>
              {faqs.length === 0 ? (
                <p className="text-slate-600 text-sm">No FAQs yet.</p>
              ) : (
                <div className="space-y-4">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="font-medium text-slate-900">{faq.question}</p>
                      <p className="text-sm text-slate-700">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Reviews</h3>
              {gig.reviews.length === 0 ? (
                <p className="text-slate-600 text-sm">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {gig.reviews.map((rev) => (
                    <div key={rev.id} className="space-y-1 border-b border-slate-100 pb-3 last:border-none">
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>{rev.user?.name || rev.user?.email}</span>
                        <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm text-amber-600">{"★".repeat(rev.rating).padEnd(5, "☆")}</div>
                      <p className="text-slate-800 text-sm">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold">
                  {(gig.user?.name || gig.user?.email || "U").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{gig.user?.name || "Seller"}</p>
                  <p className="text-sm text-slate-600">{gig.user?.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800">Packages</h4>
                <div className="space-y-3">
                  {gig.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900">{pkg.name}</p>
                        <span className="text-sm font-medium text-slate-900">${pkg.price}</span>
                      </div>
                      <p className="text-sm text-slate-700">{pkg.description}</p>
                      <p className="text-xs text-slate-600">
                        {pkg.deliveryDays} day delivery · {pkg.revisions ?? 0} revisions
                      </p>
                      <Link
                        href={session ? `/checkout?gig=${gig.slug}&package=${pkg.id}` : "/login"}
                        className="block text-center rounded-md bg-slate-900 px-3 py-2 text-white text-sm font-medium hover:bg-slate-800 transition"
                      >
                        Continue
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-sm font-semibold text-slate-800">Need something custom?</h4>
              <p className="text-sm text-slate-700">
                Message the seller to tailor this gig to your needs.
              </p>
              <Link
                href={session ? `mailto:${gig.user?.email || ""}` : "/login"}
                className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 hover:border-slate-400"
              >
                Contact seller
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
