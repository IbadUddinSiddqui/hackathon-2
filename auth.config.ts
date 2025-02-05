// auth.config.ts
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  providers: [], // Add your providers here
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;