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
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
        <AccountSidebar active="settings" />

        <div className="flex flex-1 flex-col">
          <header className="bg-white shadow dark:bg-gray-900">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
              {/* Account information */}
              <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
                <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
                  Account Information
                </h2>
                <dl className="divide-y divide-gray-100 dark:divide-gray-800">
                  <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                    <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {user.name || "—"}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                    <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {user.email || "—"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Security */}
              <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
                <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-100">
                  Security
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your password is managed by your account credentials. Keep it private and never
                  share it with anyone.
                </p>
              </div>

              {/* Sign out */}
              <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
                <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-100">
                  Sign Out
                </h2>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  You can sign back in anytime with your email and password.
                </p>
                <LogoutButton />
              </div>

              {/* Need help */}
              <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
                <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-100">
                  Need Help?
                </h2>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  Questions about an order, delivery, or returns?
                </p>
                <Link
                  href="/contact"
                  className="inline-flex rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
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
