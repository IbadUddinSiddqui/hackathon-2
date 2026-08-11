"use client";

// lib/tenant-provider.tsx
// P4-05 — client-side tenant context. The server layout resolves the active
// tenant (Host header → tenant doc → default) and seeds this provider. On
// mount it writes the `anks-tenant` cookie so client-side storefront fetches
// (ProductsGrid, product pages) scope to the same tenant.

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { writeTenantCookie, DEFAULT_TENANT_ID } from "@/lib/tenant-client";

export type TenantBranding = {
  _id: string;
  name: string;
  tagline?: string;
  contactEmail?: string;
  whatsapp?: string;
  accentColor?: string;
};

type TenantContextValue = {
  tenant: TenantBranding;
  tenantId: string;
};

const TenantContext = createContext<TenantContextValue>({
  tenant: { _id: DEFAULT_TENANT_ID, name: "AnK's" },
  tenantId: DEFAULT_TENANT_ID,
});

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: TenantBranding;
  children: ReactNode;
}) {
  const tenantId = tenant._id || DEFAULT_TENANT_ID;

  // Earliest safe moment to publish the tenant to client-side fetch code.
  useEffect(() => {
    writeTenantCookie(tenantId);
  }, [tenantId]);

  return (
    <TenantContext.Provider value={{ tenant, tenantId }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  return useContext(TenantContext);
}
