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
      <main>
        {/* Hero */}
        <section className="bg-black py-20 text-center text-white">
          <div className="mx-auto max-w-3xl px-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              About {name}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-300">{tagline}</p>
          </div>
        </section>

        {/* Story */}
        <section className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900">Our Story</h2>
          <div className="mt-4 space-y-4 text-gray-600 leading-relaxed">
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
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-2xl font-bold text-gray-900">Why Shop With Us</h2>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {VALUES.map((v) => (
                <div
                  key={v.title}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <h3 className="font-semibold text-gray-900">{v.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 text-center">
          <Link
            href="/products"
            className="inline-block rounded-full bg-black px-8 py-3 font-medium text-white transition-colors hover:bg-gray-800"
          >
            Shop the Collection
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
