"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface GigPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number | null;
}

interface Gig {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  tags: string[];
  gallery: string[];
  packages: GigPackage[];
  user: { id: string; name: string | null; email: string | null };
  reviews?: { rating: number }[];
}

interface GigResponse {
  items: Gig[];
  total: number;
  page: number;
  pageSize: number;
}

const defaultPackages = [
  { name: "Basic", description: "Starter option", price: 50, deliveryDays: 3, revisions: 1 },
  { name: "Standard", description: "More features", price: 120, deliveryDays: 5, revisions: 2 },
  { name: "Premium", description: "Full service", price: 250, deliveryDays: 7, revisions: 3 },
];

export default function GigsPage() {
  const { data: session } = useSession();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [initialLoading, setInitialLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [sort, setSort] = useState("new");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("design, landing page");
  const [galleryInput, setGalleryInput] = useState("");
  const [packages, setPackages] = useState(() => defaultPackages);
  const [faqs, setFaqs] = useState([{ question: "", answer: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchGigs = async (opts?: { page?: number }) => {
    const targetPage = opts?.page ?? page;
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (tagFilter) params.set("tag", tagFilter);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (deliveryDays) params.set("deliveryDays", deliveryDays);
    if (sort) params.set("sort", sort);
    params.set("page", String(targetPage));

    const res = await fetch(`/api/gigs?${params.toString()}`, { cache: "no-store" });
    const data: GigResponse = await res.json();
    setGigs(Array.isArray(data?.items) ? data.items : []);
    setTotal(data?.total || 0);
    setPage(data?.page || targetPage);
    setInitialLoading(false);
  };

  useEffect(() => {
    fetchGigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updatePackage = (idx: number, field: keyof typeof packages[number], value: string) => {
    setPackages((prev) =>
      prev.map((pkg, i) => {
        if (i !== idx) return pkg;
        if (field === "name" || field === "description") {
          return { ...pkg, [field]: value };
        }
        if (field === "price" || field === "deliveryDays" || field === "revisions") {
          return { ...pkg, [field]: Number(value) } as typeof pkg;
        }
        return pkg;
      })
    );
  };

  const updateFaq = (idx: number, field: "question" | "answer", value: string) => {
    setFaqs((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const addFaq = () => setFaqs((prev) => [...prev, { question: "", answer: "" }]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          tags: tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          gallery: galleryInput
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean),
          packages: packages.filter((p) => p.description && p.price > 0),
          faqs: faqs.filter((f) => f.question && f.answer),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Could not create gig.");
        setLoading(false);
        return;
      }

      setTitle("");
      setDescription("");
      setTagsInput("");
      setGalleryInput("");
      setPackages(defaultPackages);
      setFaqs([{ question: "", answer: "" }]);
      await fetchGigs({ page: 1 });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Marketplace</h1>
            <p className="text-slate-600">Browse gigs and start collaborating.</p>
          </div>
          {!session ? (
            <Link
              href="/login"
              className="text-sm font-medium text-slate-900 hover:underline"
            >
              Log in to post
            </Link>
          ) : null}
        </div>

        {session ? (
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Create a gig</h2>
            {error && (
              <div className="mb-3 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="I will design a landing page"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  rows={4}
                  placeholder="Tell buyers what you deliver."
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="tags">
                    Tags (comma separated)
                  </label>
                  <input
                    id="tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="design, web, figma"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="gallery">
                    Gallery URLs (comma separated)
                  </label>
                  <input
                    id="gallery"
                    value={galleryInput}
                    onChange={(e) => setGalleryInput(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">Packages</h3>
                  <p className="text-xs text-slate-500">Set prices, delivery, revisions.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {packages.map((pkg, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2"
                    >
                      <input
                        value={pkg.name}
                        onChange={(e) => updatePackage(idx, "name", e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 text-sm font-medium focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      />
                      <textarea
                        value={pkg.description}
                        onChange={(e) => updatePackage(idx, "description", e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        rows={3}
                        placeholder="What do buyers get?"
                      />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="space-y-1">
                          <label className="text-xs text-slate-600">Price ($)</label>
                          <input
                            type="number"
                            min={1}
                            value={pkg.price}
                            onChange={(e) => updatePackage(idx, "price", e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-slate-600">Delivery (days)</label>
                          <input
                            type="number"
                            min={1}
                            value={pkg.deliveryDays}
                            onChange={(e) => updatePackage(idx, "deliveryDays", e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-slate-600">Revisions</label>
                          <input
                            type="number"
                            min={0}
                            value={pkg.revisions ?? 0}
                            onChange={(e) => updatePackage(idx, "revisions", e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">FAQs</label>
                  <button
                    type="button"
                    onClick={addFaq}
                    className="text-xs font-medium text-slate-900 hover:underline"
                  >
                    Add FAQ
                  </button>
                </div>
                <div className="space-y-3">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="grid gap-2 md:grid-cols-2">
                      <input
                        value={faq.question}
                        onChange={(e) => updateFaq(idx, "question", e.target.value)}
                        placeholder="Question"
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      />
                      <input
                        value={faq.answer}
                        onChange={(e) => updateFaq(idx, "answer", e.target.value)}
                        placeholder="Answer"
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-white font-medium hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-60"
              >
                {loading ? "Posting..." : "Post gig"}
              </button>
            </form>
          </div>
        ) : null}

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px] space-y-1">
              <label className="text-xs font-medium text-slate-700">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find gigs..."
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="w-40 space-y-1">
              <label className="text-xs font-medium text-slate-700">Tag</label>
              <input
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value.toLowerCase())}
                placeholder="design"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="w-32 space-y-1">
              <label className="text-xs font-medium text-slate-700">Min $</label>
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="w-32 space-y-1">
              <label className="text-xs font-medium text-slate-700">Max $</label>
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="w-40 space-y-1">
              <label className="text-xs font-medium text-slate-700">Delivery ≤ (days)</label>
              <input
                type="number"
                min={1}
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="w-40 space-y-1">
              <label className="text-xs font-medium text-slate-700">Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="new">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => fetchGigs({ page: 1 })}
              className="h-10 px-4 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
            >
              Apply
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {initialLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="h-5 w-48 bg-slate-200 rounded mb-2" />
                <div className="h-4 w-80 bg-slate-200 rounded mb-1" />
                <div className="flex gap-2 mt-2">
                  <span className="h-6 w-16 bg-slate-200 rounded-full" />
                  <span className="h-6 w-16 bg-slate-200 rounded-full" />
                </div>
              </div>
            ))
          ) : gigs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-slate-600">
              No gigs yet. Be the first to post!
            </div>
          ) : (
            gigs.map((gig) => (
              <Link
                key={gig.id}
                href={`/gigs/${encodeURIComponent(gig.slug)}`}
                className="block bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-slate-300 transition"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-slate-900">{gig.title}</h3>
                    <p className="text-slate-600 line-clamp-2">{gig.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                      {(gig.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-3 py-1 font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {gig.reviews && gig.reviews.length > 0 && (
                        <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                          {(
                            gig.reviews.reduce((s, r) => s + (r.rating || 0), 0) / gig.reviews.length
                          ).toFixed(1)}{" "}
                          ★ ({gig.reviews.length})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-lg font-semibold text-slate-900">From ${gig.price}</div>
                    <div className="text-sm text-slate-600">
                      by {gig.user?.name || gig.user?.email || "Unknown"}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {total > pageSize && (
          <div className="flex items-center justify-between text-sm text-slate-700">
            <div>
              Page {page} of {Math.max(1, Math.ceil(total / pageSize))} · {total} results
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchGigs({ page: page - 1 })}
                className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page * pageSize >= total}
                onClick={() => fetchGigs({ page: page + 1 })}
                className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
