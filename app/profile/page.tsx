import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { serverClient } from "@/sanity/lib/server-client";
import { redirect } from "next/navigation";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import AccountSidebar from "../components/AccountSidebar/AccountSidebar";
import { AvatarUpload } from "../components/AvatarUpload/AvatarUpload";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your account profile.",
  robots: { index: false, follow: false },
};

export default async function Profile() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const email = session.user.email;

  const user = await serverClient.fetch<{
    _id: string;
    _createdAt?: string;
    name?: string;
    email?: string;
    avatar?: { asset?: { url?: string } };
  }>(
    `*[_type == "user" && email == $email][0]{
      _id,
      _createdAt,
      name,
      email,
      avatar{ asset->{ url } }
    }`,
    { email }
  );
  if (!user) redirect("/login");

  const memberSince = user._createdAt
    ? new Date(user._createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
      })
    : null;

  return (
    <>
      <Header />
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
        <AccountSidebar active="profile" />

        <div className="flex flex-1 flex-col">
          <header className="bg-white shadow dark:bg-gray-900">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
              {/* Profile photo */}
              <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
                <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
                  Profile Photo
                </h2>
                <AvatarUpload userId={user._id} />
              </div>

              {/* Account details */}
              <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
                <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
                  Account Details
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
                  <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Member since
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {memberSince || "—"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Quick links */}
              <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
                <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
                  Quick Links
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/dashboard"
                    className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
                  >
                    View My Orders
                  </Link>
                  <Link
                    href="/settings"
                    className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Account Settings
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}
