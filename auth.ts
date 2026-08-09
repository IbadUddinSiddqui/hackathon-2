import NextAuth from "next-auth";
import { client } from "./sanity/lib/client";
import bcrypt from "bcryptjs";

// Single source of truth for authentication.
// The route handler at app/api/auth/[...nextauth]/route.ts re-exports `handlers`
// from here so there is only ONE NextAuth config in the project.
export const { handlers, signIn, signOut, auth } = NextAuth({
  // Required when running behind a proxy (e.g. Vercel) so the host is trusted.
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const user = await client.fetch(
            `*[_type == "user" && email == $email][0]`,
            { email: credentials.email }
          );

          if (!user) return null;

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          return isValid
            ? {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
              }
            : null;
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    },
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      // Persist the user id and role into the JWT so they survive session refresh.
      if (user) {
        token.id = user.id;
        token.role = user.role || "user";
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.sub as string;
        // Read the role from the JWT (not the sign-in `user` object, which is
        // undefined on subsequent requests).
        session.user.role = token.role || "user";
      }
      return session;
    },
  },
});
