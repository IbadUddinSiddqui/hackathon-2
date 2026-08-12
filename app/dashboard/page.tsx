import type { Metadata } from "next";
import { auth } from "@/auth";
import { serverClient } from "@/sanity/lib/server-client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AvatarUpload } from "../components/AvatarUpload/AvatarUpload";
import LogoutButton from "../components/LogoutButton/LogoutButton";
import AccountSidebar from "../components/AccountSidebar/AccountSidebar";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import { getActiveTenantId, tenantFilter } from "@/lib/tenants";
import { formatDate, formatOrderId, formatTotal, statusStyle } from "@/lib/orders-ui";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your AnK's account dashboard.",
  robots: { index: false, follow: false },
};

type OrderRow = {
  _id: string;
  order_id: string;
  status: string;
  total?: number;
  currency?: string;
  created_at?: string;
  items?: { quantity?: number }[];
};

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const email = session.user.email;

  const user = await serverClient.fetch<{
    _id: string;
    name?: string;
    email?: string;
    avatar?: { asset?: { url?: string } };
  }>(
    `*[_type == "user" && email == $email][0]{
      _id,
      name,
      email,
      avatar{ asset->{ url } }
    }`,
    { email }
  );
  if (!user) redirect("/login");

  // P4-03 — the customer's own orders only (tenant-scoped).
  const tenantId = await getActiveTenantId();
  const orders = await serverClient.fetch<OrderRow[]>(
    `*[_type == "order" && customer_email == $email && ${tenantFilter()}] | order(created_at desc) [0...20] {
      _id,
      order_id,
      status,
      total,
      currency,
      created_at,
      items[]{ quantity }
    }`,
    { email, tenantId }
  );

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    paid: orders.filter((o) => o.status === "paid").length,
    spent: orders
      .filter((o) => o.status === "paid")
      .reduce((sum, o) => sum + (o.total || 0), 0),
  };

  return (
    <>
      <Header />
      <div className="flex min-h-screen bg-brand-surface text-brand-ink dark:bg-brand-ink dark:text-brand-ink-inverse">
        {/* Sidebar */}
        <AccountSidebar active="dashboard" />

        {/* Main */}
        <div className="flex flex-1 flex-col">
          <header className="border-b border-brand-line bg-brand-surface dark:bg-brand-surface-alt">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-inverse">
                Welcome{user.name ? `, ${user.name}` : ""}
              </h1>
              <LogoutButton />
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: "Total Orders", value: String(stats.total) },
                  { label: "Pending", value: String(stats.pending) },
                  { label: "Paid", value: String(stats.paid) },
                  { label: "Total Spent (paid)", value: `Rs ${stats.spent.toFixed(2)}` },
                ].map((s) => (
                  <div key={s.label} className="border border-brand-line bg-brand-surface p-5 dark:bg-brand-surface-alt">
                    <div className="text-sm font-medium text-brand-muted">{s.label}</div>
                    <div className="mt-1 text-2xl font-bold tabular-nums">{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Orders */}
              <div className="border border-brand-line bg-brand-surface p-6 dark:bg-brand-surface-alt">
                <h2 className="mb-4 text-xl font-semibold tracking-tight">Your Orders</h2>
                {orders.length === 0 ? (
                  <p className="text-brand-muted">
                    You haven&apos;t placed any orders yet.{" "}
                    <Link href="/" className="font-medium underline underline-offset-4 hover:opacity-80">
                      Start shopping →
                    </Link>
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto text-left text-sm">
                      <thead>
                        <tr className="border-b border-brand-line text-brand-muted">
                          <th className="px-4 py-3 font-medium">Order</th>
                          <th className="px-4 py-3 font-medium">Date</th>
                          <th className="px-4 py-3 font-medium">Items</th>
                          <th className="px-4 py-3 font-medium">Total</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => {
                          const itemCount = (order.items || []).reduce(
                            (sum, item) => sum + (item.quantity || 0),
                            0
                          );
                          return (
                            <tr key={order._id} className="border-b border-brand-line last:border-0">
                              <td className="px-4 py-3 font-mono text-xs text-brand-muted">
                                {formatOrderId(order.order_id)}
                              </td>
                              <td className="px-4 py-3 text-brand-muted">
                                {formatDate(order.created_at)}
                              </td>
                              <td className="px-4 py-3 text-brand-muted">
                                {itemCount > 0 ? `${itemCount} item${itemCount > 1 ? "s" : ""}` : "—"}
                              </td>
                              <td className="px-4 py-3 font-semibold tabular-nums">
                                {formatTotal(order.total)}
                                {order.currency && order.total != null && (
                                  <span className="ml-1 text-xs font-normal uppercase text-brand-muted">
                                    {order.currency}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle(order.status)}`}
                                >
                                  {order.status || "unknown"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Profile photo */}
              <div className="border border-brand-line bg-brand-surface p-6 dark:bg-brand-surface-alt">
                <h2 className="mb-4 text-xl font-semibold tracking-tight">Profile Photo</h2>
                <AvatarUpload userId={user._id} />
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}
