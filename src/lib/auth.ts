import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from './db';

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash.startsWith('pbkdf2:')) return false;
  const parts = storedHash.split(':');
  const saltHex = parts[1];
  const expectedHashHex = parts[2];
  const encoder = new TextEncoder();
  const saltBytes = new Uint8Array(saltHex.match(/.{2}/g)!.map((h: string) => parseInt(h, 16)));
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hashBuf = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const hashHex = Array.from(new Uint8Array(hashBuf)).map((b: number) => b.toString(16).padStart(2, '0')).join('');
  return hashHex === expectedHashHex;
}

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
        const valid = await verifyPassword(credentials.password as string, user.passwordHash);
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
