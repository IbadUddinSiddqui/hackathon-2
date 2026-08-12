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
      <div className="flex min-h-screen bg-brand-surface text-brand-ink ">
        <AccountSidebar active="profile" />

        <div className="flex flex-1 flex-col">
          <header className="border-b border-brand-line bg-brand-surface dark:bg-brand-surface-alt">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-bold tracking-tight text-brand-ink ">My Profile</h1>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
              {/* Profile photo */}
              <div className="border border-brand-line bg-brand-surface p-6 dark:bg-brand-surface-alt">
                <h2 className="mb-4 text-xl font-semibold tracking-tight">Profile Photo</h2>
                <AvatarUpload userId={user._id} />
              </div>

              {/* Account details */}
              <div className="border border-brand-line bg-brand-surface p-6 dark:bg-brand-surface-alt">
                <h2 className="mb-4 text-xl font-semibold tracking-tight">Account Details</h2>
                <dl className="divide-y divide-brand-line">
                  <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <dt className="text-sm font-medium text-brand-muted">Name</dt>
                    <dd className="text-sm font-semibold">{user.name || "—"}</dd>
                  </div>
                  <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <dt className="text-sm font-medium text-brand-muted">Email</dt>
                    <dd className="text-sm font-semibold">{user.email || "—"}</dd>
                  </div>
                  <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <dt className="text-sm font-medium text-brand-muted">Member since</dt>
                    <dd className="text-sm font-semibold">{memberSince || "—"}</dd>
                  </div>
                </dl>
              </div>

              {/* Quick links */}
              <div className="border border-brand-line bg-brand-surface p-6 dark:bg-brand-surface-alt">
                <h2 className="mb-4 text-xl font-semibold tracking-tight">Quick Links</h2>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/dashboard"
                    className="bg-brand-ink px-5 py-2.5 text-sm font-semibold text-brand-ink-inverse transition-opacity hover:opacity-90 dark:bg-brand-ink-inverse dark:text-brand-ink"
                  >
                    View My Orders
                  </Link>
                  <Link
                    href="/settings"
                    className="border border-brand-line-strong px-5 py-2.5 text-sm font-semibold text-brand-muted transition-colors hover:border-brand-ink hover:text-brand-ink dark:hover:border-brand-ink-inverse dark:hover:text-brand-ink-inverse"
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
