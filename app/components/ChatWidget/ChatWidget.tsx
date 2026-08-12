"use client";

// app/components/ChatWidget/ChatWidget.tsx
// P4-15 — floating storefront chat widget. Answers FAQs from the seeded
// knowledge base via /api/faq (no LLM cost) and always shows a clear
// "talk to a human" path (WhatsApp / email) using the tenant's branding.

import React, { useState, useRef, useEffect } from "react";
import { useTenant } from "@/lib/tenant-provider";
import { FaWhatsapp } from "react-icons/fa";

type Message = { from: "bot" | "user"; text: string };

const QUICK_QUESTIONS = [
  "How long does delivery take?",
  "Do you offer Cash on Delivery?",
  "What is your return policy?",
  "How do I find my size?",
];

export default function ChatWidget() {
  const { tenant } = useTenant();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { from: "bot", text: "Assalam-o-Alaikum! 👋 How can we help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || typing) return;
    setMessages((m) => [...m, { from: "user", text: q }]);
    setInput("");
    setTyping(true);
    try {
      const res = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { from: "bot", text: data.answer || "Please try again." }]);
    } catch {
      setMessages((m) => [
        ...m,
        { from: "bot", text: "Sorry, something went wrong. Try the WhatsApp button below!" },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const whatsapp = tenant.whatsapp?.replace(/[^0-9]/g, "");
  const email = tenant.contactEmail;

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Chat with us"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-ink text-brand-ink-inverse shadow-brand-2 transition-transform hover:scale-105 dark:bg-brand-ink-inverse dark:text-brand-ink"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.14 2 11.33c0 2.9 1.34 5.47 3.44 7.2L4.4 22l3.86-1.97c1.13.4 2.36.62 3.74.62 5.52 0 10-4.14 10-9.32C22 6.14 17.52 2 12 2z" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between bg-brand-ink px-4 py-3 text-brand-ink-inverse dark:bg-brand-ink-inverse dark:text-brand-ink">
            <div>
              <p className="font-bold">{tenant.name} Support</p>
              <p className="text-xs opacity-90">Usually replies instantly</p>
            </div>
            <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.15em] text-brand-ok">● Online</span>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="h-72 space-y-3 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    m.from === "user"
                      ? "bg-brand-ink text-brand-ink-inverse dark:bg-brand-ink-inverse dark:text-brand-ink"
                      : "border border-brand-line bg-brand-surface text-brand-ink dark:bg-brand-surface-alt "
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white px-3 py-2 text-sm text-gray-400 dark:bg-gray-700">
                  typing…
                </div>
              </div>
            )}
          </div>

          {/* Quick questions */}
          <div className="flex flex-wrap gap-1.5 border-t border-gray-100 bg-white px-3 pt-2 dark:border-gray-700 dark:bg-gray-800">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="rounded-full border border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 bg-white p-3 dark:bg-gray-800">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Type your question…"
              className="flex-1 border border-brand-line bg-transparent px-4 py-2 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-ink focus:outline-none dark:border-brand-line  "
            />
            <button
              onClick={() => send(input)}
              disabled={typing || !input.trim()}
              className="bg-brand-ink px-4 py-2 text-sm font-semibold text-brand-ink-inverse transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-brand-ink-inverse dark:text-brand-ink"
            >
              Send
            </button>
          </div>

          {/* Human escalation */}
          <div className="flex items-center gap-3 border-t border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900">
            <span className="text-xs text-gray-500 dark:text-gray-400">Talk to a human:</span>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-semibold text-brand-ok underline underline-offset-4 hover:opacity-70"
              >
                <FaWhatsapp className="h-4 w-4" /> WhatsApp
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="text-sm font-semibold text-brand-ink underline underline-offset-4 hover:opacity-70 ">
                Email
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
