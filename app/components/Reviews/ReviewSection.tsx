"use client";

import { useCallback, useEffect, useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";

type ReviewDoc = {
  _id: string;
  rating: number;
  title?: string;
  body?: string;
  customerName?: string;
  createdAt?: string;
};

export default function ReviewSection({ productId }: { productId: string }) {
  const { locale } = useLocale();
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          title,
          body,
          customerName,
          customerEmail,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to submit review");
      setMessage(data?.message || "Thanks for your review!");
      setTitle("");
      setBody("");
      setCustomerName("");
      setCustomerEmail("");
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="mt-12">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <MessageSquare className="h-5 w-5" /> {t(locale, "product.reviews")}
        {reviews.length > 0 && (
          <span className="text-base font-medium text-gray-400">
            ({avg.toFixed(1)} avg · {reviews.length})
          </span>
        )}
      </h2>

      {/* Approved reviews */}
      <div className="mt-4 space-y-4">
        {loading ? (
          <p className="text-gray-400">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-400">No reviews yet — be the first!</p>
        ) : (
          reviews.map((review) => (
            <div
              key={review._id}
              className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </span>
                {review.title && (
                  <span className="font-semibold">{review.title}</span>
                )}
              </div>
              {review.body && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{review.body}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                {review.customerName || "Guest"}
                {review.createdAt
                  ? ` · ${new Date(review.createdAt).toLocaleDateString()}`
                  : ""}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Submit form */}
      <form onSubmit={submit} className="mt-8 rounded-lg border border-gray-200 p-5 dark:border-gray-700">
        <h3 className="font-semibold">{t(locale, "product.writeReview")}</h3>
        <div className="mt-3 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setRating(i + 1)}
              onMouseEnter={() => setHoverRating(i + 1)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`${i + 1} star${i ? "s" : ""}`}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-6 w-6 ${
                  i < (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            maxLength={80}
            className="rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          />
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Your name (optional)"
            className="rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
        <input
          type="email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          placeholder="Email (optional — for moderation)"
          className="mt-3 w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tell others what you think…"
          rows={4}
          maxLength={1000}
          className="mt-3 w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
          {message && <span className="text-sm text-green-600 dark:text-green-400">{message}</span>}
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
      </form>
    </div>
  );
}
