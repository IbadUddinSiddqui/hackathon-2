// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { client } from "@/sanity/lib/client";
import bcrypt from "bcryptjs";



const authConfig = {
  providers: [
    Credentials({
      name: "credentials",
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
          
          return isValid ? { 
            id: user._id, 
            email: user.email, 
            name: user.name 
          } : null;
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {

    
    async session({ session, token }: { session: any, token: any }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, user }: { token: any, user?: any }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async signOut( ) {
        // Add any custom logout logic here
        return true;
      },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};

export const { 
  handlers: { GET, POST }, 
  
} = NextAuth(authConfig);