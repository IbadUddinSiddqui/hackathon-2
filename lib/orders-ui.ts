export const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  refunded: "bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
};

export function statusStyle(status?: string): string {
  return (
    STATUS_STYLES[status || ""] ||
    "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300"
  );
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTotal(total?: number): string {
  return total != null ? `Rs ${total.toFixed(2)}` : "—";
}

export function formatOrderId(orderId?: string): string {
  return `#${(orderId || "").slice(0, 8).toUpperCase()}`;
}
