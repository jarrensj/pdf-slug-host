# pdf slug host

A website where users can upload a pdf, choose a unique slug, and host their pdf at a custom url like:

`https://<domain>/[slug]`

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- Upload a pdf
- Choose a unique slug (e.g., `/restaurant-name`)
- The pdf is viewable / downloadable at the url
- Users provide a username and password to manage the slug
- Create a qr code for the slug
- Verify ownership before allowing updates (replacing the pdf) for a slug

## Stack

- Next.js
- Supabase (auth & database)
- Amazon S3

## Supabase Table: `pdf_slugs`

| Column          | Type      | Description                       |
|-----------------|:----------|:----------------------------------|
| `id`            | uuid      | primary key                      |
| `slug`          | text      | unique slug for pdf access       |
| `user_id`       | uuid      | owner                            |
| `pdf`           | text      | public url to the pdf            |
| `created_at`    | timestamp | timestamp of create              |
| `updated_at`    | timestamp | timestamp of update              |

## User Flow

1. User signs up with email and password
2. User uploads a pdf
3. Enters a unique slug
4. The pdf is accessible at `https://<domain>/[slug]`
5. To update the pdf, the user must be authenticated and the owner of the slug

## Future 

- Add Stripe: Charge $1 for initial upload / update fee
