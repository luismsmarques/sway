# Solo-Flow

Booking engine for independent instructors.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create local env file:

```bash
cp .env.example .env.local
```

3. Fill Supabase variables in `.env.local`.

4. Run dev server:

```bash
npm run dev
```

## Supabase setup

Run the SQL schema from `supabase/schema.sql` in your Supabase SQL Editor.

## Deploy (Vercel)

1. Import this repository in Vercel.
2. Add env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy.
