"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, MessageSquare, Check, X } from "lucide-react";

type Review = {
  _id: string;
  rating: number;
  title?: string;
  body?: string;
  customerName?: string;
  customerEmail?: string;
  productName?: string;
  status?: string;
  createdAt?: string;
};

export default function ReviewsManager() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reviews");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error(`Failed to load reviews (HTTP ${res.status})`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (e: any) {
      setError(e.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const moderate = async (id: string, status: "approved" | "rejected") => {
    setWorkingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to update review");
      }
      load();
    } catch (e: any) {
      setError(e.message || "Failed to update review");
    } finally {
      setWorkingId(null);
    }
  };

  const statusBadge = (status?: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400";
      case "approved":
        return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && reviews.length === 0 ? (
        <div className="flex items-center justify-center gap-3 rounded-lg border border-stroke bg-white px-4 py-16 text-gray-400 shadow-default dark:border-strokedark dark:bg-boxdark dark:text-bodydark2">
          <span className="block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
          Loading reviews…
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-lg border border-stroke bg-white px-4 py-16 text-center text-gray-400 shadow-default dark:border-strokedark dark:bg-boxdark dark:text-bodydark2">
          <MessageSquare className="mx-auto mb-2 h-10 w-10 opacity-50" />
          No reviews yet.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="rounded-lg border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
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
                  <span className="font-semibold text-black dark:text-white">
                    {review.title || "Untitled"}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge(
                      review.status
                    )}`}
                  >
                    {review.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {review.status !== "approved" && (
                    <button
                      onClick={() => moderate(review._id, "approved")}
                      disabled={workingId === review._id}
                      className="inline-flex items-center gap-1 rounded border border-green-500 px-2.5 py-1 text-xs font-medium text-green-600 hover:bg-green-50 disabled:opacity-50 dark:hover:bg-green-900/30"
                    >
                      <Check className="h-3 w-3" /> Approve
                    </button>
                  )}
                  {review.status !== "rejected" && (
                    <button
                      onClick={() => moderate(review._id, "rejected")}
                      disabled={workingId === review._id}
                      className="inline-flex items-center gap-1 rounded border border-red-500 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/30"
                    >
                      <X className="h-3 w-3" /> Reject
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-bodydark2">
                {review.body || "—"}
              </p>
              <p className="mt-2 text-xs text-gray-400 dark:text-bodydark2">
                {review.customerName || "Guest"} · {review.customerEmail || "no email"} · on{" "}
                {review.productName || "unknown product"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
