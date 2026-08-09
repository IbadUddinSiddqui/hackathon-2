// app/api/auth/[...nextauth]/route.ts
// Single NextAuth instance lives in auth.ts — this route just exposes its handlers.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
