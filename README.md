# Midcent Streaming — Landing Page

Live site: **https://streaming.midcent.se**

A standalone React app that pulls articles from the midcent.se WordPress CMS and presents them as a magazine-style streaming news hub with filtering by service and time period.

---

## What it does

- Fetches posts from the WordPress REST API (category: Underhållning / streaming)
- Displays them in zones: Hero, Popular, News, More news, Archive
- Filter by streaming service: Netflix, HBO Max, Disney+, Amazon Prime, Apple TV+, Viaplay, Showtime
- Filter by time period: All, Last 30 days, Last 5 years, Older
- Single post view with similar articles and sidebar
- Full SEO: Open Graph, Twitter Card, JSON-LD structured data
- Google consent banner (Funding Choices) shared with midcent.se via `.midcent.se` cookie domain
- Link prefetching on hover for faster article clicks

## Stack

| Tool | Purpose |
|---|---|
| React 19 + TypeScript | UI framework |
| Vite | Build tool and dev server |
| React Router | Client-side routing |
| react-helmet-async | Per-page `<title>` and meta tags |
| WordPress REST API | Content source (midcent.se) |
| Cloudflare Pages | Hosting and edge caching |

## Project structure

```
streaming/
  index.html         — Base HTML: GTM, Consent Mode v2, Funding Choices, SEO tags
  public/
    logos/           — Streaming service logo images (.avif)
    _headers         — Cloudflare cache headers (prevents index.html caching)
  src/
    App.tsx          — Root app, routing, error boundary
    main.tsx         — Entry point
    index.css        — All styles
    config/
      categories.ts  — Hostname → category config (WP category ID, meta, filters)
    pages/
      Home.tsx       — Home page with post grid and filters
      PostPage.tsx   — Single post view
    components/
      Header.tsx     — Site header with nav, hamburger menu, and search
    lib/
      wpCache.ts     — WordPress API fetch with memory + localStorage cache
      prefetch.ts    — Prefetches article URLs on hover for faster navigation
    types/
      wordpress.ts   — TypeScript types for WP API responses
```

## Local development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. API calls go to `midcent.se` — no local backend needed.

## Deployment

Hosted on **Cloudflare Pages**. Every push to `main` triggers an automatic deploy.

- Build command: `npm run build`
- Output directory: `dist`
- Root directory: *(empty)*

## Adding a new category subdomain

1. Add a DNS CNAME in Cloudflare pointing the subdomain to the Pages deployment
2. Add the subdomain as a custom domain in Cloudflare Pages settings
3. Add one entry to `CATEGORIES` in `src/config/categories.ts`
4. Push — no other code changes needed

## Consent and analytics

- **Google Tag Manager** (GTM-KTQ6JC8) — same container as midcent.se
- **Google Funding Choices** (`pub-5936716338661368`) — consent banner
- **Google Consent Mode v2** — all tracking held until user consents
- The `FCCDCF` consent cookie is set at `.midcent.se` domain level, so consent on either streaming.midcent.se or midcent.se covers both sites

## Troubleshooting

**Blank page after deploy**
Cloudflare may have cached a bad JS file. Go to Cloudflare dashboard → domain → Caching → Custom Purge → enter the specific JS file URL (e.g. `https://streaming.midcent.se/assets/index-XXXXX.js`). Do NOT purge everything — midcent.se has thousands of cached pages.

**Consent banner not showing**
Test in a private browser window with no existing cookies. The banner is suppressed if the `FCCDCF` cookie already exists from a previous midcent.se visit.
