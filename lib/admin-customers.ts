// lib/admin-customers.ts
// P3-02 — pure, testable logic for the admin customer-list API. Mirrors the
// lib/admin-products.ts pattern: parse → build GROQ → map summary.

export type CustomerListQuery = {
  page: number;
  limit: number;
  search?: string;
};

export type CustomerSummary = {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  orderCount: number;
  totalSpent: number;
  creditBalance: number;
  points: number;
  createdAt?: string;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MIN_LIMIT = 1;

export function parseCustomerListQuery(url: URL): CustomerListQuery {
  const rawPage = url.searchParams.get("page");
  const rawLimit = url.searchParams.get("limit");

  const page =
    rawPage !== null && Number.isInteger(Number(rawPage)) && Number(rawPage) > 0
      ? Number(rawPage)
      : 1;
  const limit =
    rawLimit !== null && Number.isInteger(Number(rawLimit))
      ? Math.min(Math.max(Number(rawLimit), MIN_LIMIT), MAX_LIMIT)
      : DEFAULT_LIMIT;

  const search = url.searchParams.get("search")?.trim() || undefined;

  return { page, limit, search };
}

/** Build list + count GROQ for customers. search matches email or name prefix. */
export function buildCustomerListGroq(
  query: CustomerListQuery,
  tenantId: string = "tenant-anks"
): {
  groq: string;
  countGroq: string;
  params: Record<string, unknown>;
} {
  const filters = [
    "_type == \"customer\"",
    "(!defined(tenantId) || tenantId == $tenantId)",
    "(!defined($search) || email match $search || name match $search)",
  ].join(" && ");

  const offset = (query.page - 1) * query.limit;
  // Optional filter must be null, never undefined (GROQ rejects "undefined").
  const params: Record<string, unknown> = {
    tenantId,
    search: query.search ? `${query.search}*` : null,
    offset,
    limit: query.limit,
  };

  return {
    groq: `*[${filters}] | order(orderCount desc) [$offset...$limit] {
      _id,
      email,
      name,
      phone,
      orderCount,
      totalSpent,
      creditBalance,
      points,
      createdAt
    }`,
    countGroq: `count(*[${filters}])`,
    params,
  };
}

type RawCustomerDoc = {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  orderCount?: number;
  totalSpent?: number;
  creditBalance?: number;
  points?: number;
  createdAt?: string;
};

export function toCustomerSummary(doc: RawCustomerDoc): CustomerSummary {
  return {
    _id: doc._id,
    email: doc.email,
    name: doc.name,
    phone: doc.phone,
    orderCount: doc.orderCount ?? 0,
    totalSpent: doc.totalSpent ?? 0,
    creditBalance: doc.creditBalance ?? 0,
    points: doc.points ?? 0,
    createdAt: doc.createdAt,
  };
}
