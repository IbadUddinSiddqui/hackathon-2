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
      
          console.log("Fetched User:", user); // ✅ Debug user data
      
          if (!user) return null;
      
          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
      
          const result = isValid
            ? {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role, // ✅ Debugging this
              }
            : null;
      
          console.log("Authorize Return:", result); // ✅ Debug output
      
          return result;
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      }
      ,
    }),
  ],
  callbacks: {

    async signIn({ user }: { user: any }) {
      // First-time user setup
      if (user) {
        await client
          .patch(user.id)
          .setIfMissing({ role: 'user' })
          .commit();
      }
      return true;
    },



    
    async session({ session, token,user }: { session: any, token: any , user : any}) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = user?.role || 'user';
      }
      return session;
    },
     async jwt({ token, user }: { token: any, user: any }) {
    console.log("JWT Before:", token); // ✅ Debugging
    if (user) {
      token.id = user.id;
      token.role = user?.role || "user"; // ✅ Ensure role is included
    }
    console.log("JWT After:", token); // ✅ Debugging
    return token;
  },

    async signOut() {
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