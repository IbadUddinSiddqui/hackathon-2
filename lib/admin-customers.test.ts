import { describe, it, expect } from "vitest";
import {
  parseCustomerListQuery,
  buildCustomerListGroq,
  toCustomerSummary,
} from "./admin-customers";

describe("parseCustomerListQuery", () => {
  it("defaults to page 1 / limit 20", () => {
    const q = parseCustomerListQuery(new URL("http://localhost/api/admin/customers"));
    expect(q).toEqual({ page: 1, limit: 20, search: undefined });
  });

  it("reads page/limit/search", () => {
    const q = parseCustomerListQuery(
      new URL("http://localhost/api/admin/customers?page=2&limit=50&search=ibad")
    );
    expect(q).toEqual({ page: 2, limit: 50, search: "ibad" });
  });

  it("clamps page/limit", () => {
    const q = parseCustomerListQuery(
      new URL("http://localhost/api/admin/customers?page=0&limit=500")
    );
    expect(q.page).toBe(1);
    expect(q.limit).toBe(100);
  });
});

describe("buildCustomerListGroq", () => {
  it("uses null for absent search (never undefined)", () => {
    const { params } = buildCustomerListGroq({ page: 1, limit: 20 });
    expect(params.search).toBeNull();
    expect(params.offset).toBe(0);
    expect(params.limit).toBe(20);
  });

  it("builds a search glob and correct offset", () => {
    const { params, groq } = buildCustomerListGroq({
      page: 3,
      limit: 25,
      search: "ibad",
    });
    expect(params).toMatchObject({ search: "ibad*", offset: 50, limit: 25 });
    expect(groq).toContain("email match $search");
    expect(groq).toContain("order(orderCount desc)");
  });

  it("count query shares the same filters", () => {
    const { countGroq } = buildCustomerListGroq({ page: 1, limit: 20 });
    expect(countGroq).toContain("count(*[");
    expect(countGroq).toContain('_type == "customer"');
  });
});

describe("toCustomerSummary", () => {
  it("maps a doc with defaults for missing counters", () => {
    const s = toCustomerSummary({ _id: "c1", email: "a@b.com" });
    expect(s.orderCount).toBe(0);
    expect(s.totalSpent).toBe(0);
    expect(s.creditBalance).toBe(0);
    expect(s.points).toBe(0);
  });

  it("keeps populated fields", () => {
    const s = toCustomerSummary({
      _id: "c1",
      email: "a@b.com",
      name: "Ali",
      orderCount: 3,
      totalSpent: 4500,
      creditBalance: 200,
      points: 45,
    });
    expect(s.name).toBe("Ali");
    expect(s.orderCount).toBe(3);
    expect(s.totalSpent).toBe(4500);
  });
});
