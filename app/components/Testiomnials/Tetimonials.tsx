"use client";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa6";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useTenant } from "@/lib/tenant-provider";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";

// Placeholder testimonials — the client's final copy can replace these.
// The brand is ALWAYS interpolated at render from the active tenant (via the
// {brand} token), so the section can never display a hardcoded competitor
// name, on any tenant.
const TESTIMONIALS = [
  {
    name: "Sarah M.",
    rating: 5,
    review:
      "I'm blown away by the quality and fit of the clothes I received from {brand}. From casual tees to elegant dresses, every piece I've ordered has exceeded my expectations.",
  },
  {
    name: "Alex K.",
    rating: 5,
    review:
      "Finding clothes that match my personal style used to be a struggle until I discovered {brand}. The range they offer is remarkable — there's something for every taste and occasion.",
  },
  {
    name: "James L.",
    rating: 5,
    review:
      "As someone always on the lookout for unique fashion pieces, I'm thrilled to have found {brand}. The selection is not just diverse — it's on-point with the latest trends.",
  },
  {
    name: "Ayesha R.",
    rating: 5,
    review:
      "Ordering from {brand} was effortless and delivery to Lahore arrived faster than expected. The fabric quality is genuinely premium for the price.",
  },
  {
    name: "Bilal K.",
    rating: 4,
    review:
      "Great value for money, and their support team sorted my size exchange within a day. I'll definitely be ordering from {brand} again.",
  },
];

const PER_PAGE = 3;

/** Two-letter monogram avatar derived from the reviewer's name. */
function initialsFor(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const TestimonialCard: React.FC = () => {
  const { tenant } = useTenant();
  const { locale } = useLocale();
  const brand = tenant.name || "AnK's";

  // Brand interpolation (split/join avoids replaceAll lib-version concerns).
  // Memoized on the brand so the array isn't rebuilt on every render.
  const testimonials = useMemo(
    () =>
      TESTIMONIALS.map((t) => ({
        ...t,
        review: t.review.split("{brand}").join(brand),
      })),
    [brand]
  );

  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);

  const totalPages = Math.ceil(testimonials.length / PER_PAGE);
  const startIndex = currentPage * PER_PAGE;
  const currentTestimonials = testimonials.slice(startIndex, startIndex + PER_PAGE);
  const isPrevDisabled = currentPage === 0;
  const isNextDisabled = startIndex + PER_PAGE >= testimonials.length;

  const paginate = (dir: number) => {
    setDirection(dir);
    setCurrentPage((prev) =>
      dir > 0 ? Math.min(prev + 1, totalPages - 1) : Math.max(prev - 1, 0)
    );
  };

  // Direction-aware spring slide + fade — matches the motion quality used
  // across the storefront (staggered entrances, spring drawers, etc.).
  const pageVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 64 : -64, opacity: 0 }),
    center: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 260, damping: 24 },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -64 : 64,
      opacity: 0,
      transition: { duration: 0.18 },
    }),
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 lg:px-8" id="testimonial">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <p className="text-eyebrow mb-3 text-brand-muted">Social proof</p>
          <h2 className="text-3xl font-bold tracking-tight text-brand-ink  sm:text-4xl">
            {t(locale, "product.reviews")}
          </h2>
        </div>
        {/* Navigation Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => paginate(-1)}
            disabled={isPrevDisabled}
            aria-label="Previous testimonials"
            className={`flex h-11 w-11 items-center justify-center border border-brand-line-strong text-brand-ink transition-colors  ${
              isPrevDisabled
                ? "cursor-not-allowed opacity-40"
                : "hover:border-brand-ink hover:bg-brand-surface-alt dark:hover:border-brand-ink-inverse dark:hover:bg-brand-charcoal"
            }`}
          >
            <FaArrowLeft />
          </button>
          <button
            onClick={() => paginate(1)}
            disabled={isNextDisabled}
            aria-label="Next testimonials"
            className={`flex h-11 w-11 items-center justify-center border border-brand-line-strong text-brand-ink transition-colors  ${
              isNextDisabled
                ? "cursor-not-allowed opacity-40"
                : "hover:border-brand-ink hover:bg-brand-surface-alt dark:hover:border-brand-ink-inverse dark:hover:bg-brand-charcoal"
            }`}
          >
            <FaArrowRight />
          </button>
        </div>
      </div>

      {/* Animated page — slides/fades out, then the next page springs in */}
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={currentPage}
          custom={direction}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 min-h-[420px] md:min-h-[380px]"
        >
          {currentTestimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="border border-brand-line bg-brand-surface p-7 dark:bg-brand-surface-alt"
            >
              <CardHeader>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill={i < testimonial.rating ? "currentColor" : "none"}
                      stroke={i < testimonial.rating ? "currentColor" : "currentColor"}
                      className={`h-5 w-5 ${i < testimonial.rating ? "text-brand-warn" : "text-brand-line-strong"}`}
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {/* Real avatar — initials monogram (no external image needed) */}
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center bg-brand-ink text-sm font-bold text-brand-ink-inverse dark:bg-brand-ink-inverse dark:text-brand-ink"
                    aria-hidden
                  >
                    {initialsFor(testimonial.name)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-semibold text-brand-ink ">
                      {testimonial.name}
                    </h3>
                    <Image
                      src="/check.svg"
                      alt="Verified buyer"
                      width="20"
                      height="20"
                    />
                  </div>
                </div>
                <p className="text-left text-[15px] leading-relaxed text-brand-muted">{`"${testimonial.review}"`}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Pagination Dots */}
      <div className="mt-10 flex justify-center">
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentPage ? 1 : -1);
                setCurrentPage(index);
              }}
              aria-label={`Go to testimonial page ${index + 1}`}
              className={`h-1.5 transition-all duration-300 ${
                index === currentPage
                  ? "w-8 bg-brand-ink dark:bg-brand-ink-inverse"
                  : "w-3 bg-brand-line-strong hover:bg-brand-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialCard;
