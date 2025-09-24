// FIXED VERSION - Replace your entire lib/auth.ts with this:

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "./db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Authorization attempt for:", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.error("❌ Missing credentials");
          return null;
        }

        try {
          // Connect to database
          console.log("🔄 Connecting to database...");
          await connectToDatabase();
          console.log("✅ Database connected successfully");
          
          // Normalize email (same way as registration and User model)
          const normalizedEmail = credentials.email.trim().toLowerCase();
          console.log("🔍 Looking for user with normalized email:", normalizedEmail);
          
          // Find user - the User model already handles lowercase, but let's be explicit
          // IMPORTANT: We need to explicitly select the password field since it might be excluded by default
          const user = await User.findOne({ 
            email: normalizedEmail 
          }).select('+password');

          if (!user) {
            console.log("❌ No user found with email:", normalizedEmail);
            
            // Debug: Let's see what users exist
            const userCount = await User.countDocuments();
            const sampleUsers = await User.find({}).select('email').limit(3);
            console.log(`📊 Total users in DB: ${userCount}`);
            console.log("📋 Sample users:", sampleUsers.map(u => u.email));
            
            return null;
          }

          console.log("👤 User found:", user.email);
          console.log("👤 User ID:", user._id);
          
          // Verify password field exists
          if (!user.password) {
            console.log("❌ User found but password field is missing!");
            console.log("Available fields:", Object.keys(user.toObject()));
            return null;
          }
          
          console.log("🔐 Password field exists, length:", user.password.length);
          console.log("🔐 Password hash format check:", user.password.startsWith('$2') ? 'Valid bcrypt hash' : 'Invalid hash format');

          // Verify password
          console.log("🔒 Verifying password...");
          console.log("🔒 Input password length:", credentials.password.length);
          
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValidPassword) {
            console.log("❌ Password verification failed");
            console.log("🔍 Debug info:");
            console.log("   - Hash starts with $2a/$2b:", user.password.substring(0, 4));
            console.log("   - Input password preview:", credentials.password.substring(0, 2) + '***');
            return null;
          }

          console.log("✅ Authentication successful for:", user.email);

          // Return user object (password will be excluded from JWT)
          return {
            id: user._id.toString(),
            email: user.email,
          };

        } catch (error: any) {
          console.error("💥 Authentication error:", error.message);
          console.error("💥 Full error:", error);
          
          // Don't throw errors for authentication failures - just return null
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signOut() {
      console.log("User signed out successfully");
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};