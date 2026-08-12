import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { serverClient } from "@/sanity/lib/server-client";
import { redirect } from "next/navigation";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import AccountSidebar from "../components/AccountSidebar/AccountSidebar";
import LogoutButton from "../components/LogoutButton/LogoutButton";

export const metadata: Metadata = {
  title: "Settings",
  description: "Your account settings.",
  robots: { index: false, follow: false },
};

export default async function Settings() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const email = session.user.email;

  const user = await serverClient.fetch<{
    _id: string;
    name?: string;
    email?: string;
  }>(
    `*[_type == "user" && email == $email][0]{
      _id,
      name,
      email
    }`,
    { email }
  );
  if (!user) redirect("/login");

  return (
    <>
      <Header />
      <div className="flex min-h-screen bg-brand-surface text-brand-ink dark:bg-brand-ink dark:text-brand-ink-inverse">
        <AccountSidebar active="settings" />

        <div className="flex flex-1 flex-col">
          <header className="border-b border-brand-line bg-brand-surface dark:bg-brand-surface-alt">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-inverse">Settings</h1>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
              {/* Account information */}
              <div className="border border-brand-line bg-brand-surface p-6 dark:bg-brand-surface-alt">
                <h2 className="mb-4 text-xl font-semibold tracking-tight">Account Information</h2>
                <dl className="divide-y divide-brand-line">
                  <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <dt className="text-sm font-medium text-brand-muted">Name</dt>
                    <dd className="text-sm font-semibold">{user.name || "—"}</dd>
                  </div>
                  <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <dt className="text-sm font-medium text-brand-muted">Email</dt>
                    <dd className="text-sm font-semibold">{user.email || "—"}</dd>
                  </div>
                </dl>
              </div>

              {/* Security */}
              <div className="border border-brand-line bg-brand-surface p-6 dark:bg-brand-surface-alt">
                <h2 className="mb-2 text-xl font-semibold tracking-tight">Security</h2>
                <p className="text-sm text-brand-muted">
                  Your password is managed by your account credentials. Keep it private and never
                  share it with anyone.
                </p>
              </div>

              {/* Sign out */}
              <div className="border border-brand-line bg-brand-surface p-6 dark:bg-brand-surface-alt">
                <h2 className="mb-2 text-xl font-semibold tracking-tight">Sign Out</h2>
                <p className="mb-4 text-sm text-brand-muted">
                  You can sign back in anytime with your email and password.
                </p>
                <LogoutButton />
              </div>

              {/* Need help */}
              <div className="border border-brand-line bg-brand-surface p-6 dark:bg-brand-surface-alt">
                <h2 className="mb-2 text-xl font-semibold tracking-tight">Need Help?</h2>
                <p className="mb-4 text-sm text-brand-muted">
                  Questions about an order, delivery, or returns?
                </p>
                <Link
                  href="/contact"
                  className="inline-flex border border-brand-line-strong px-5 py-2.5 text-sm font-semibold text-brand-muted transition-colors hover:border-brand-ink hover:text-brand-ink dark:hover:border-brand-ink-inverse dark:hover:text-brand-ink-inverse"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}
