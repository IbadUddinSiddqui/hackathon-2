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
      <main className="mx-auto max-w-3xl bg-brand-surface px-4 py-16 text-brand-ink dark:bg-brand-ink dark:text-brand-ink-inverse">
        <p className="text-eyebrow mb-3 text-brand-muted">Support</p>
        <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
        <p className="mt-3 text-brand-muted">
          Questions about an order, sizing, or your delivery? We&apos;re here to help.
        </p>

        <div className="mt-10 space-y-4">
          {email ? (
            <a
              href={`mailto:${email}`}
              className="flex items-center justify-between border border-brand-line bg-brand-surface p-6 transition-colors hover:border-brand-line-strong dark:bg-brand-surface-alt"
            >
              <div>
                <div className="text-sm font-medium text-brand-muted">Email</div>
                <div className="mt-1 font-semibold">{email}</div>
              </div>
              <span className="text-2xl">✉️</span>
            </a>
          ) : (
            <div className="border border-brand-line bg-brand-surface p-6 dark:bg-brand-surface-alt">
              <div className="text-sm font-medium text-brand-muted">Email</div>
              <div className="mt-1 text-brand-muted">Email support coming soon.</div>
            </div>
          )}

          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between border border-brand-line bg-brand-surface p-6 transition-colors hover:border-brand-line-strong dark:bg-brand-surface-alt"
            >
              <div>
                <div className="text-sm font-medium text-brand-muted">WhatsApp</div>
                <div className="mt-1 font-semibold">{tenant.branding?.whatsapp}</div>
              </div>
              <span className="text-2xl">💬</span>
            </a>
          )}

          <div className="border border-brand-line bg-brand-surface p-6 dark:bg-brand-surface-alt">
            <div className="text-sm font-medium text-brand-muted">Store</div>
            <div className="mt-1 font-semibold">{name}</div>
            <div className="mt-1 text-sm text-brand-muted">
              Karachi, Pakistan · Mon–Sat, 10am–7pm
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
