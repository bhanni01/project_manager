import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@pt/db";
import type { Role } from "@pt/db";

import { writeAuditEvent } from "@/lib/auth/audit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        await writeAuditEvent({
          action: "LOGIN",
          actorUserId: user.id,
          targetType: "User",
          targetId: user.id,
        });
      }
    },
    async signOut(message) {
      const actorId =
        "token" in message && message.token && "id" in message.token
          ? (message.token.id as string)
          : null;
      if (actorId) {
        await writeAuditEvent({
          action: "LOGOUT",
          actorUserId: actorId,
          targetType: "User",
          targetId: actorId,
        });
      }
    },
  },
});
