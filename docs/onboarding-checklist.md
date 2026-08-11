# Tenant Onboarding Checklist (P4-10)

> **Status: code-ready.** The platform can create tenants (Platform console →
> `/adminpanel/tenants`, or `POST /api/admin/tenants`), and Host-header routing
> is fully wired (`lib/tenants.ts` → `getActiveTenant`). What remains is the
> *human* process below — the first real client going live on their own domain.

## Steps to onboard a new client brand

### 1. Create the tenant
- **UI:** `/adminpanel/tenants` → "Create tenant" (name, slug, plan, billing status)
- **API:** `POST /api/admin/tenants` `{ name, slug, domains, plan, billingStatus }`
- Produces a Sanity `tenant` doc (e.g. `tenant-xyz`).

### 2. Point the client's domain
- Ask the client to add a **CNAME record** (subdomain, e.g. `store.xyzclothing.pk`) **or an A record** (apex, e.g. `xyzclothing.pk`) pointing at the deployment host (Vercel default domain).
- Add the domain(s) to the tenant's `domains[]` field in the Platform console (or `PATCH /api/admin/tenants`).
- **Verify:** `curl -H "Host: xyzclothing.pk" https://<deploy-url>/` returns the tenant's branded homepage (name/tagline/accent).

### 3. Verify SSL
- Vercel auto-provisions certificates once DNS resolves. Confirm `https://xyzclothing.pk` loads with a valid cert.

### 4. Set per-tenant payment config (P4-06)
- In the Platform console → tenant → Payment Config, set the client's own Safepay keys + webhook secret + currency.
- If empty, the platform env vars are used (default tenant only).

### 5. Seed the catalog
- Products are created per-tenant via `/adminpanel/products` (each gets `tenantId`).
- Optional: use the Excel bulk import (`/adminpanel/products` → import) for large catalogs.
- Re-run search sync: `npm run sync` (or the Sanity webhook does it per product).

### 6. Verify isolation
- Log in as the tenant's admin → confirm only their products/orders/customers appear.
- Visit their domain → merchant feed (`/api/merchant-feed`), sitemap, and search only contain their products.

## Rollback
- Remove the domain from `domains[]` → traffic falls back to the default tenant immediately (cached ≤ 60 s).
