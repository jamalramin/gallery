This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Gallery

The public gallery is available at `/`. Sign in at `/admin` to add items with
an image, name, and price. Admin sessions use an HTTP-only cookie and expire
after eight hours.

### Local development

Without hosted storage credentials, development uses `data/gallery.json` and
`public/uploads`. This local mode is disabled on Vercel.

### Deploying to Vercel

The deployed app uses Neon Postgres for item records and public Vercel Blob
storage for images:

1. Create a Neon Postgres database and set `DATABASE_URL`.
2. Run [`migrations/001_gallery_items.sql`](./migrations/001_gallery_items.sql)
   once in the Neon SQL editor.
3. Create a **public** Vercel Blob store and set `BLOB_READ_WRITE_TOKEN`.
4. Set `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `GALARY_ADMIN_USERNAME`, and
   `GALARY_ADMIN_PASSWORD` in the Vercel project's environment variables.
   Keep these values private, and use a strong, unique admin password.
5. To copy items already saved locally, add `DATABASE_URL` and
   `BLOB_READ_WRITE_TOKEN` to `.env.local` and run `pnpm migrate:gallery`.
6. Import the project into Vercel and deploy. Vercel's Git integration can
   build and deploy future pushes automatically.

The Vercel Blob token and database URL are secrets; do not commit them. Local
filesystem data is not automatically included in a deployment.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
