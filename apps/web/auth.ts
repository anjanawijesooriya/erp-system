import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "@erp/db";
import { tenants, users } from "@erp/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        shopSlug: {},
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const shopSlug = credentials?.shopSlug as string | undefined;
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!shopSlug || !email || !password) return null;

        // Single-domain SaaS: the tenant is resolved from a shop slug entered at
        // login, not from a per-tenant subdomain. Email is only unique *within*
        // a tenant (see users_tenant_email_idx), so the slug must be resolved first.
        const tenant = await db.query.tenants.findFirst({
          where: and(eq(tenants.slug, shopSlug), eq(tenants.isActive, true)),
        });
        if (!tenant) return null;

        const user = await db.query.users.findFirst({
          where: and(eq(users.tenantId, tenant.id), eq(users.email, email)),
        });
        if (!user || !user.passwordHash || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          tenantId: user.tenantId,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.tenantId = (user as { tenantId?: string }).tenantId;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as typeof session.user & { tenantId?: string }).tenantId = token.tenantId as
          | string
          | undefined;
        (session.user as typeof session.user & { id?: string }).id = token.sub ?? "";
      }
      return session;
    },
  },
});
