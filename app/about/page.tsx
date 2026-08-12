import type { Metadata } from "next";
import Link from "next/link";
import { getActiveTenant } from "@/lib/tenants";
import { SITE_NAME } from "@/lib/site";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getActiveTenant();
  return { title: { absolute: `About | ${tenant.name || SITE_NAME}` } };
}

const VALUES = [
  {
    title: "Premium Quality",
    text: "Carefully sourced fabrics and precise stitching, so every piece lasts beyond the season.",
  },
  {
    title: "Nationwide Delivery",
    text: "Fast, tracked shipping across Pakistan — with Cash on Delivery available everywhere.",
  },
  {
    title: "Easy Returns",
    text: "Changed your mind? Simple size exchanges and returns so you always buy with confidence.",
  },
];

export default async function AboutPage() {
  const tenant = await getActiveTenant();
  const name = tenant.name || SITE_NAME;
  const tagline =
    tenant.branding?.tagline ||
    "Pakistani fashion and clothing — crafted for comfort, designed for confidence.";

  return (
    <>
      <Header />
      <main className="bg-brand-surface text-brand-ink ">
        {/* Hero */}
        <section className="bg-brand-ink py-20 text-center text-brand-ink-inverse">
          <div className="mx-auto max-w-3xl px-4">
            <p className="text-eyebrow mb-4 text-brand-ink-inverse/60">The label</p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">About {name}</h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-brand-ink-inverse/70">{tagline}</p>
          </div>
        </section>

        {/* Story */}
        <section className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-2xl font-bold tracking-tight">Our Story</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-brand-muted">
            <p>
              {name} started with a simple belief: that Pakistani style deserves clothing
              that is modern, comfortable, and made to last. From everyday tees to
              statement kurtas and streetwear, every piece is designed with the way you
              actually live in mind.
            </p>
            <p>
              We keep things simple — honest prices, quality fabrics, and delivery you can
              count on across the country. What you see is what you get, and what you get
              is made to be worn, washed, and loved.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="border-y border-brand-line bg-brand-surface-alt/50 py-16 dark:bg-brand-surface-alt/30">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-2xl font-bold tracking-tight">Why Shop With Us</h2>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {VALUES.map((v) => (
                <div
                  key={v.title}
                  className="border border-brand-line bg-brand-surface p-6 transition-colors hover:border-brand-line-strong dark:bg-brand-surface-alt"
                >
                  <h3 className="font-semibold">{v.title}</h3>
                  <p className="mt-2 text-sm text-brand-muted">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 text-center">
          <Link
            href="/products"
            className="inline-block bg-brand-ink px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.15em] text-brand-ink-inverse transition-opacity hover:opacity-90 dark:bg-brand-ink-inverse dark:text-brand-ink"
          >
            Shop the Collection
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
