import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

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
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        try {
          const { neon } = await import('@neondatabase/serverless');
          const sql = neon(process.env.DATABASE_URL!);
          const rows = await sql`SELECT id, username, "fullName", role, "passwordHash", "isActive" FROM "User" WHERE username = ${credentials.username as string} LIMIT 1`;
          const user = rows[0];
          if (!user || !user.isActive) return null;
          const valid = await verifyPassword(credentials.password as string, user.passwordHash as string);
          if (!valid) return null;
          return { id: user.id as string, name: user.fullName as string, email: user.username as string, role: user.role as string };
        } catch (e) {
          console.error('Auth error:', e);
          return null;
        }
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
