import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Shared admin check — the single source of truth for "is this session an
 * admin?" Used by both page guards and API routes so the role/email logic
 * (and the fallback owner email) never drifts.
 */
export function isAdmin(session: {
  user?: { role?: string | null; email?: string | null } | null;
} | null): boolean {
  return Boolean(
    session?.user &&
      (session.user.role === "admin" ||
        session.user.email === "ibaduddinsiddiqui418@gmail.com")
  );
}

/**
 * Server-side guard for admin-only pages. Returns the session when the user is
 * an admin (or the fallback owner email), otherwise redirects to /denied.
 */
export async function requireAdmin() {
  const session = await auth();

  if (!isAdmin(session)) {
    redirect("/denied");
  }

  return session;
}
