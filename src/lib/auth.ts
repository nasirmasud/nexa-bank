import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) return null;
        if (user.lockedUntil && user.lockedUntil > new Date()) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          const failedLogins = user.failedLogins + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLogins,
              lockedUntil: failedLogins >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
            },
          });
          return null;
        }
        if (user.status !== "ACTIVE") return null;
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLogins: 0, lockedUntil: null },
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id && token.role && token.sessionVersion !== undefined) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.sessionVersion = token.sessionVersion as number;
      }
      return session;
    },
  },
});
