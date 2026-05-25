# Cloudflare Pages Deployment

1. Push repo to GitHub
2. Connect to Cloudflare Pages
3. Build command: npx @cloudflare/next-on-pages
4. Output dir: .vercel/output/static
5. Set env vars: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
6. Run: npm run db:push && npm run db:seed
