import type { Metadata } from "next";
import { auth } from "@/auth";
import { serverClient } from "@/sanity/lib/server-client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AvatarUpload } from "../components/AvatarUpload/AvatarUpload";
import LogoutButton from "../components/LogoutButton/LogoutButton";
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

const NAV = [
  { label: "Dashboard", href: "/dashboard", active: true },
  { label: "Profile", href: "/profile", active: false },
  { label: "Settings", href: "/settings", active: false },
];

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
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="hidden w-64 bg-white shadow-md md:block">
          <div className="border-b p-6">
            <h2 className="text-2xl font-bold text-gray-800">My Account</h2>
          </div>
          <nav className="mt-2">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`block px-6 py-3 transition-colors ${
                  item.active
                    ? "border-l-4 border-black bg-gray-100 font-semibold text-gray-900"
                    : "text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/"
              className="block px-6 py-3 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-800"
            >
              ← Back to store
            </Link>
          </nav>
        </aside>

        {/* Main */}
        <div className="flex flex-1 flex-col">
          <header className="bg-white shadow">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-bold text-gray-900">
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
                  <div key={s.label} className="rounded-lg bg-white p-5 shadow">
                    <div className="text-sm font-medium text-gray-500">{s.label}</div>
                    <div className="mt-1 text-2xl font-bold text-gray-900">{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Orders */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-semibold text-gray-800">Your Orders</h2>
                {orders.length === 0 ? (
                  <p className="text-gray-500">
                    You haven&apos;t placed any orders yet.{" "}
                    <Link href="/" className="font-medium text-blue-700 underline">
                      Start shopping →
                    </Link>
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500">
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
                            <tr key={order._id} className="border-b border-gray-100 last:border-0">
                              <td className="px-4 py-3 font-mono text-xs text-gray-700">
                                {formatOrderId(order.order_id)}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {formatDate(order.created_at)}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {itemCount > 0 ? `${itemCount} item${itemCount > 1 ? "s" : ""}` : "—"}
                              </td>
                              <td className="px-4 py-3 font-semibold text-gray-900">
                                {formatTotal(order.total)}
                                {order.currency && order.total != null && (
                                  <span className="ml-1 text-xs font-normal uppercase text-gray-400">
                                    {order.currency}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(order.status)}`}
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
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-semibold text-gray-800">Profile Photo</h2>
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
