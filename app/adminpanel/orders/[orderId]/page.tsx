import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DefaultLayout from "@/app/components/Layouts/DefaultLayout";
import StatusChanger from "../StatusChanger";
import { serverClient } from "@/sanity/lib/server-client";
import { requireTenantAdmin, tenantFilter } from "@/lib/tenants";
import { formatDate, formatOrderId, formatTotal } from "@/lib/orders-ui";
import { isHexColor } from "@/lib/is-hex-color";

export const metadata: Metadata = {
  title: "Order Details | AnK's Admin",
  description: "View a customer order",
};

type OrderItem = {
  _key?: string;
  name?: string;
  price?: number;
  quantity?: number;
  size?: string[];
  color?: string;
  product?: {
    _id: string;
    category_slug?: string;
  };
};

type Order = {
  _id: string;
  order_id: string;
  status: string;
  customer_email?: string;
  customer_name?: string;
  subtotal?: number;
  total?: number;
  currency?: string;
  created_at?: string;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  items?: OrderItem[];
};

async function getOrderById(id: string, tenantId: string): Promise<Order | null> {
  return serverClient.fetch(
    `*[_type == "order" && _id == $id && ${tenantFilter()}][0] {
      _id,
      order_id,
      status,
      customer_email,
      customer_name,
      subtotal,
      total,
      currency,
      created_at,
      stripe_session_id,
      stripe_payment_intent_id,
      items[] {
        _key,
        name,
        price,
        quantity,
        size,
        color,
        "product": product->{ _id, category_slug }
      }
    }`,
    { id, tenantId }
  );
}

/**
 * Build the storefront product URL: /products/{category_slug}/{_id}
 * (matches the routes used by ProductsGrid). Returns null when the product
 * reference is missing or was deleted.
 */
function productHref(item: OrderItem): string | null {
  const product = item.product;
  if (!product?._id) return null;
  const category = product.category_slug || "all";
  return `/products/${category}/${product._id}`;
}

/**
 * Deep-link into the embedded Sanity Studio editor for the product document
 * (intent URL format — works regardless of the structure tool name).
 */
function studioHref(item: OrderItem): string | null {
  const id = item.product?._id;
  if (!id) return null;
  return `/studio/intent/edit/id=${id};type=product`;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { tenantId } = await requireTenantAdmin();

  const { orderId } = await params;
  // A genuine "not found" renders 404; fetch failures bubble up to app/error.tsx.
  const order = await getOrderById(orderId, tenantId);

  if (!order) {
    notFound();
  }

  const lineTotal = (item: OrderItem) => (item.price || 0) * (item.quantity || 0);

  return (
    <DefaultLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/adminpanel/orders"
              className="mb-2 inline-flex items-center gap-1 text-sm text-primary hover:underline dark:text-white"
            >
              ← Back to Orders
            </Link>
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Order {formatOrderId(order.order_id)}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-bodydark2">
              Placed {formatDate(order.created_at)}
            </p>
          </div>
          <StatusChanger
            key={order._id}
            orderId={order._id}
            currentStatus={order.status || "pending"}
          />
        </div>

        {/* Customer + Payment info */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h2 className="mb-3 font-semibold text-black dark:text-white">Customer</h2>
            <div className="text-sm text-gray-600 dark:text-bodydark2">
              <p className="font-medium text-black dark:text-white">
                {order.customer_name || "Guest"}
              </p>
              <p className="mt-1">{order.customer_email || "—"}</p>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h2 className="mb-3 font-semibold text-black dark:text-white">Payment</h2>
            <div className="space-y-2 text-sm text-gray-600 dark:text-bodydark2">
              <div>
                <span className="text-gray-400 dark:text-bodydark2">Stripe Session:</span>{" "}
                <span className="font-mono text-xs text-black dark:text-white">
                  {order.stripe_session_id || "—"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 dark:text-bodydark2">Payment Intent:</span>{" "}
                <span className="font-mono text-xs text-black dark:text-white">
                  {order.stripe_payment_intent_id || "—"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 dark:text-bodydark2">Currency:</span>{" "}
                <span className="uppercase text-black dark:text-white">
                  {order.currency || "usd"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
            <h2 className="font-semibold text-black dark:text-white">Items</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-50 text-gray-500 dark:border-strokedark dark:bg-meta-4 dark:text-bodydark2">
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">Color</th>
                  <th className="px-6 py-3 font-medium">Size</th>
                  <th className="px-6 py-3 font-medium">Unit Price</th>
                  <th className="px-6 py-3 font-medium">Qty</th>
                  <th className="px-6 py-3 font-medium text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-bodydark2">
                      No line items recorded for this order.
                    </td>
                  </tr>
                ) : (
                  (order.items || []).map((item, index) => {
                    const href = productHref(item);
                    return (
                      <tr
                        key={item._key || index}
                        className="border-b border-stroke last:border-0 dark:border-strokedark"
                      >
                        <td className="px-6 py-4">
                          {item.name ? (
                            <div className="flex flex-wrap items-center gap-2">
                              {href ? (
                                <Link
                                  href={href}
                                  className="font-medium text-primary underline-offset-2 hover:underline dark:text-white"
                                >
                                  {item.name}
                                </Link>
                              ) : (
                                <span className="font-medium text-black dark:text-white">
                                  {item.name}
                                </span>
                              )}
                              {studioHref(item) && (
                                <Link
                                  href={studioHref(item)!}
                                  title="Edit product in Sanity Studio"
                                  className="inline-flex items-center gap-1 rounded border border-stroke px-2 py-0.5 text-xs text-gray-500 hover:border-primary hover:text-primary dark:border-strokedark dark:text-bodydark2 dark:hover:text-white"
                                >
                                  <svg
                                    className="h-3 w-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                    />
                                  </svg>
                                  Edit
                                </Link>
                              )}
                            </div>
                          ) : (
                            <span className="font-medium text-black dark:text-white">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-bodydark2">
                          {item.color ? (
                            <span className="inline-flex items-center gap-1.5">
                              {isHexColor(item.color) && (
                                <span
                                  className="inline-block h-3 w-3 rounded-full border border-black/10"
                                  style={{ backgroundColor: item.color }}
                                />
                              )}
                              {item.color}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-bodydark2">
                          {item.size?.length ? item.size.join(", ") : "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-bodydark2">
                          {formatTotal(item.price)}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-bodydark2">
                          {item.quantity ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-black dark:text-white">
                          {formatTotal(lineTotal(item))}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-stroke px-6 py-4 dark:border-strokedark">
            <div className="ml-auto flex max-w-xs flex-col gap-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-bodydark2">
                <span>Subtotal</span>
                <span>{formatTotal(order.subtotal ?? order.total)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-black dark:text-white">
                <span>Total</span>
                <span>
                  {formatTotal(order.total)}
                  {order.currency && order.total != null && (
                    <span className="ml-1 text-xs font-normal uppercase text-gray-400">
                      {order.currency}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
