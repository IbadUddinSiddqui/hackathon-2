import type { Metadata } from "next";
import { getActiveTenant } from "@/lib/tenants";
import { SITE_NAME } from "@/lib/site";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getActiveTenant();
  return { title: { absolute: `Contact | ${tenant.name || SITE_NAME}` } };
}

/** Strip non-digits from a WhatsApp number for wa.me links. */
function waLink(number?: string): string | null {
  if (!number) return null;
  const digits = number.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export default async function ContactPage() {
  const tenant = await getActiveTenant();
  const name = tenant.name || SITE_NAME;
  const email = tenant.branding?.contactEmail;
  const whatsapp = waLink(tenant.branding?.whatsapp);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Contact Us</h1>
        <p className="mt-3 text-gray-600">
          Questions about an order, sizing, or your delivery? We&apos;re here to help.
        </p>

        <div className="mt-10 space-y-4">
          {email ? (
            <a
              href={`mailto:${email}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <div className="text-sm font-medium text-gray-500">Email</div>
                <div className="mt-1 font-semibold text-gray-900">{email}</div>
              </div>
              <span className="text-2xl">✉️</span>
            </a>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-500">Email</div>
              <div className="mt-1 text-gray-600">Email support coming soon.</div>
            </div>
          )}

          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <div className="text-sm font-medium text-gray-500">WhatsApp</div>
                <div className="mt-1 font-semibold text-gray-900">
                  {tenant.branding?.whatsapp}
                </div>
              </div>
              <span className="text-2xl">💬</span>
            </a>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Store</div>
            <div className="mt-1 font-semibold text-gray-900">{name}</div>
            <div className="mt-1 text-sm text-gray-600">
              Karachi, Pakistan · Mon–Sat, 10am–7pm
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
