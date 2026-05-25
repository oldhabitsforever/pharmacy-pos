import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const user = await db.user.findUnique({ where: { username: credentials.username as string } });
        if (!user || !user.isActive) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, name: user.fullName, email: user.username, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.role = (user as any).role; token.id = user.id; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { (session.user as any).role = token.role; (session.user as any).id = token.id; }
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
});
