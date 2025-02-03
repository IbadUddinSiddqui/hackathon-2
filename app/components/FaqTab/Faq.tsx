"use client";
import React from "react";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqProps = {
  faqs: FaqItem[];
};

const FaqTab: React.FC<FaqProps> = ({ faqs }) => {
  return (
    <div className="space-y-4 p-6">
      {faqs.map((faq, index) => (
        <details
          key={index}
          className="group border-s-4 border-green-500 bg-gray-50 p-6 [&_summary::-webkit-details-marker]:hidden"
          open={index === 0} // Keep the first item open by default
        >
          <summary className="flex cursor-pointer items-center justify-between gap-1.5">
            <h2 className="text-lg font-medium text-gray-900">{faq.question}</h2>
            <span className="shrink-0 rounded-full bg-white p-1.5 text-gray-900 sm:p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-5 shrink-0 transition duration-300 group-open:-rotate-45"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </summary>

          <p className="mt-4 leading-relaxed text-gray-700">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
};

export default FaqTab;
