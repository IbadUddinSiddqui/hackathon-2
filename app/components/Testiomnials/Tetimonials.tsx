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
    <div className="relative p-8 mt-12" id="testimonial">
      <div className="flex justify-between">
        <h2 className="text-left text-3xl ml-4 m-2 font-bold tracking-tight sm:text-4xl text-black dark:text-gray-100">
          OUR HAPPY CUSTOMERS
        </h2>
        {/* Navigation Buttons */}
        <div className="mt-6">
          <div className="absolute right-8 -top-[10px] text-3xl flex space-x-4">
            <button
              onClick={() => paginate(-1)}
              disabled={isPrevDisabled}
              aria-label="Previous testimonials"
              className={`px-4 text-black py-4 text-[22px] md:text-2xl lg:text-3xl dark:text-gray-100 ${
                isPrevDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:text-gray-500 transition-colors"
              }`}
            >
              <FaArrowLeft />
            </button>
            <button
              onClick={() => paginate(1)}
              disabled={isNextDisabled}
              aria-label="Next testimonials"
              className={`px-2 py-4 text-[22px] text-black md:text-2xl lg:text-3xl dark:text-gray-100 ${
                isNextDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:text-gray-500 transition-colors"
              }`}
            >
              <FaArrowRight />
            </button>
          </div>
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center mt-4 min-h-[420px] md:min-h-[380px]"
        >
          {currentTestimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="p-6 border h-[420px] md:h-[380px] border-black w-72 md:w-80 lg:w-80 xl:w-[420px] 2xl:w-[420px] rounded-3xl shadow-lg dark:border-gray-700 dark:bg-gray-800/40"
            >
              <CardHeader>
                <div className="flex mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill={i < testimonial.rating ? "gold" : "gray"}
                      className="w-6 h-6"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {/* Real avatar — initials monogram (no external image needed) */}
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white"
                    aria-hidden
                  >
                    {initialsFor(testimonial.name)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-semibold text-black dark:text-gray-100">
                      {testimonial.name}
                    </h3>
                    <Image
                      src="/check.svg"
                      alt="Verified buyer"
                      width="24"
                      height="25"
                    />
                  </div>
                </div>
                <p className="text-left text-gray-500 text-lg mb-6 dark:text-gray-400">{`"${testimonial.review}"`}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Pagination Dots */}
      <div className="flex flex-start ml-8">
        <div className="flex justify-center items-center mt-8">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentPage ? 1 : -1);
                setCurrentPage(index);
              }}
              aria-label={`Go to testimonial page ${index + 1}`}
              className={`w-2 h-2 mx-1 rounded-full transition-colors duration-300 ${
                index === currentPage
                  ? "bg-black dark:bg-white"
                  : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
