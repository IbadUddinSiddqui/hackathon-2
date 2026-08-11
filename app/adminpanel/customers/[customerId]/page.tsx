import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DefaultLayout from "@/app/components/Layouts/DefaultLayout";
import { serverClient } from "@/sanity/lib/server-client";
import { requireTenantAdmin } from "@/lib/tenants";
import { formatDate, formatTotal, statusStyle } from "@/lib/orders-ui";
import AdjustCustomer from "./AdjustCustomer";

export const metadata: Metadata = {
  title: "Customer Detail | AnK's Admin",
};

type Order = {
  _id: string;
  order_id: string;
  status: string;
  total?: number;
  created_at?: string;
  items?: { quantity?: number }[];
};

async function getCustomer(customerId: string, tenantId: string) {
  return serverClient.fetch(
    `*[_type == "customer" && _id == $id && (!defined(tenantId) || tenantId == $tenantId)][0]{
      _id, email, name, phone, orderCount, totalSpent, creditBalance, points, createdAt
    }`,
    { id: customerId, tenantId }
  );
}

async function getCustomerOrders(customerId: string, tenantId: string): Promise<Order[]> {
  return serverClient.fetch(
    `*[_type == "order" && customer._ref == $customerId && (!defined(tenantId) || tenantId == $tenantId)] | order(created_at desc) {
      _id, order_id, status, total, created_at, items[]{quantity}
    }`,
    { customerId, tenantId }
  );
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { tenantId } = await requireTenantAdmin();
  const { customerId } = await params;

  let customer: Awaited<ReturnType<typeof getCustomer>> | null = null;
  try {
    customer = await getCustomer(customerId, tenantId);
  } catch (error) {
    console.error("Failed to load customer:", error);
  }
  if (!customer) notFound();

  const orders = await getCustomerOrders(customerId, tenantId).catch(() => []);

  return (
    <DefaultLayout>
      <div className="flex flex-col gap-6">
        <Link
          href="/adminpanel/customers"
          className="text-sm text-primary hover:underline"
        >
          ← Back to customers
        </Link>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Name", value: customer.name || "Guest" },
            { label: "Email", value: customer.email },
            { label: "Orders", value: String(customer.orderCount ?? 0) },
            { label: "Total Spent", value: `Rs ${(customer.totalSpent ?? 0).toLocaleString()}` },
            { label: "Joined", value: formatDate(customer.createdAt) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark"
            >
              <span className="text-sm font-medium text-gray-500 dark:text-bodydark2">
                {stat.label}
              </span>
              <h3 className="mt-1 truncate text-lg font-bold text-black dark:text-white">
                {stat.value}
              </h3>
            </div>
          ))}
        </div>

        {/* Credit + points strip */}
        <div className="flex flex-wrap gap-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
            Store credit: Rs {(customer.creditBalance ?? 0).toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
            Loyalty points: {customer.points ?? 0}
          </span>
        </div>

        {/* P3-14 — admin adjust balances */}
        <AdjustCustomer customerId={customerId} />

        {/* Order history */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
            <h2 className="font-semibold text-black dark:text-white">Order History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-50 text-gray-500 dark:border-strokedark dark:bg-meta-4 dark:text-bodydark2">
                  <th className="px-6 py-3 font-medium">Order</th>
                  <th className="px-6 py-3 font-medium">Items</th>
                  <th className="px-6 py-3 font-medium">Total</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-bodydark2">
                      No linked orders found for this customer.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const itemCount = (order.items || []).reduce(
                      (sum, item) => sum + (item.quantity || 0),
                      0
                    );
                    return (
                      <tr
                        key={order._id}
                        className="border-b border-stroke last:border-0 hover:bg-gray-50 dark:border-strokedark dark:hover:bg-meta-4/50"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/adminpanel/orders/${order._id}`}
                            className="font-mono text-xs text-primary hover:underline dark:text-white"
                          >
                            #{order.order_id.slice(0, 8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-bodydark2">
                          {itemCount > 0 ? `${itemCount} item${itemCount > 1 ? "s" : ""}` : "—"}
                        </td>
                        <td className="px-6 py-4 font-semibold text-black dark:text-white">
                          {formatTotal(order.total)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-bodydark2">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
