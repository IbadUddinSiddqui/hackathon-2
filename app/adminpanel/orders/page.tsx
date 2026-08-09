import type { Metadata } from "next";
import DefaultLayout from "@/app/components/Layouts/DefaultLayout";
import OrderRow from "./OrderRow";
import { requireAdmin } from "@/lib/admin";
import { serverClient } from "@/sanity/lib/server-client";
import { formatDate, formatOrderId, formatTotal, statusStyle } from "@/lib/orders-ui";

export const metadata: Metadata = {
  title: "Orders | Bazaar Nest Admin",
  description: "Manage customer orders",
};

type OrderItem = {
  name?: string;
  price?: number;
  quantity?: number;
};

type Order = {
  _id: string;
  order_id: string;
  status: string;
  customer_email?: string;
  customer_name?: string;
  total?: number;
  currency?: string;
  created_at?: string;
  items?: OrderItem[];
};

async function getOrders(): Promise<Order[]> {
  return serverClient.fetch(
    `*[_type == "order"] | order(created_at desc) {
      _id,
      order_id,
      status,
      customer_email,
      customer_name,
      total,
      currency,
      created_at,
      items[] { name, price, quantity }
    }`
  );
}

export default async function OrdersPage() {
  await requireAdmin();

  let orders: Order[] = [];
  let loadError = false;
  try {
    orders = await getOrders();
  } catch (error) {
    console.error("Failed to load orders:", error);
    loadError = true;
  }

  const stats = {
    total: orders.length,
    paid: orders.filter((o) => o.status === "paid").length,
    pending: orders.filter((o) => o.status === "pending").length,
    revenue: orders
      .filter((o) => o.status === "paid")
      .reduce((sum, o) => sum + (o.total || 0), 0),
  };

  return (
    <DefaultLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Orders</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-bodydark2">
            All customer orders recorded via the Stripe webhook. Click a row for details.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <span className="text-sm font-medium text-gray-500 dark:text-bodydark2">Total Orders</span>
            <h3 className="mt-2 text-3xl font-bold text-black dark:text-white">{stats.total}</h3>
          </div>
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <span className="text-sm font-medium text-gray-500 dark:text-bodydark2">Paid</span>
            <h3 className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{stats.paid}</h3>
          </div>
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <span className="text-sm font-medium text-gray-500 dark:text-bodydark2">Pending</span>
            <h3 className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</h3>
          </div>
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <span className="text-sm font-medium text-gray-500 dark:text-bodydark2">Revenue (paid)</span>
            <h3 className="mt-2 text-3xl font-bold text-black dark:text-white">
              Rs {stats.revenue.toFixed(2)}
            </h3>
          </div>
        </div>

        {/* Orders table */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
            <h2 className="font-semibold text-black dark:text-white">Order List</h2>
          </div>

          <div className="overflow-x-auto">
            {loadError ? (
              <div className="px-6 py-12 text-center text-red-500">
                Failed to load orders. Please try again later.
              </div>
            ) : (
              <table className="w-full table-auto text-left text-sm">
                <thead>
                  <tr className="border-b border-stroke bg-gray-50 text-gray-500 dark:border-strokedark dark:bg-meta-4 dark:text-bodydark2">
                    <th className="px-6 py-3 font-medium">Order ID</th>
                    <th className="px-6 py-3 font-medium">Customer</th>
                    <th className="px-6 py-3 font-medium">Items</th>
                    <th className="px-6 py-3 font-medium">Total</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-bodydark2">
                        No orders yet. Orders will appear here once customers check out.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => {
                      const itemCount = (order.items || []).reduce(
                        (sum, item) => sum + (item.quantity || 0),
                        0
                      );
                      return (
                        <OrderRow key={order._id} orderId={order._id}>
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs text-primary dark:text-white">
                              {formatOrderId(order.order_id)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-black dark:text-white">
                              {order.customer_name || "Guest"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-bodydark2">
                              {order.customer_email || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-bodydark2">
                            {itemCount > 0 ? `${itemCount} item${itemCount > 1 ? "s" : ""}` : "—"}
                          </td>
                          <td className="px-6 py-4 font-semibold text-black dark:text-white">
                            {formatTotal(order.total)}
                            {order.currency && order.total != null && (
                              <span className="ml-1 text-xs font-normal uppercase text-gray-400">
                                {order.currency}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(order.status)}`}
                            >
                              {order.status || "unknown"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-bodydark2">
                            {formatDate(order.created_at)}
                          </td>
                        </OrderRow>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
