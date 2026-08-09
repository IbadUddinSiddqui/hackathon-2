"use client";

import React from "react";
import { useRouter } from "next/navigation";

/**
 * Clickable table row that navigates to the order detail page. Keeps the
 * <tr>/<td> table structure intact (correct column alignment) while making the
 * whole row a click target.
 */
export default function OrderRow({
  orderId,
  children,
}: {
  orderId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/adminpanel/orders/${orderId}`)}
      className="cursor-pointer border-b border-stroke last:border-0 hover:bg-gray-50 dark:border-strokedark dark:hover:bg-meta-4"
    >
      {children}
    </tr>
  );
}
