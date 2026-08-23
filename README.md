# Secure Login Portal

A clean, responsive login screen protected with Supabase Authentication.

## Supabase setup

1. Create a project at [Supabase](https://supabase.com).
2. Open **Project Settings → API**.
3. Copy the **Project URL** and **anon/public key**.
4. Add them to `supabase-config.js`.
5. In **Authentication → Users**, create the owner account.
6. In **Authentication → Providers → Email**, disable public sign-ups if only the owner should log in.

The browser-safe anon key may be used in the frontend. Never place the Supabase service-role key in this repository.

## Local preview

Open the project through a local web server, for example:

```bash
npx serve .
```

Then open the displayed URL. This repository is also ready for static deployment on Vercel.
