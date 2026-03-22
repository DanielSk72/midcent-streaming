# CLAUDE.md — Project Rules for Claude Code

This file is automatically read by Claude at the start of every session.
It defines how Claude should behave when working on this project.

---

## Project Overview

**Name:** Midcent Streaming Landing Page
**Live site:** https://streaming.midcent.se
**Main site:** https://midcent.se (WordPress CMS — content is managed here)
**Repo:** https://github.com/DanielSk72/midcent-streaming
**Stack:** React 19, TypeScript, Vite, React Router, React Helmet
**Data source:** WordPress REST API at `midcent.se/wp-json/wp/v2/posts`

### What the site does

This is a standalone landing page for the streaming section of midcent.se. It pulls articles from the WordPress CMS and presents them as a browsable magazine-style front page with filtering.

**Home page (`/`)**
- Fetches all posts in category 1 (streaming) from the WP REST API, up to 100 per page, across all pages in parallel
- Excludes posts tagged as book reviews, audiobooks, or music reviews
- Displays posts in four zones: Hero (top post), Popular (2 cards), News (3 cards), More news (4 list items), Archive (rest)
- Two filter bars let the visitor narrow by streaming service (Netflix, HBO Max, Disney+, Amazon Prime, Apple TV+, Viaplay, Showtime) and by time period (All, News = last 30 days, Last 5 years, Older)
- Service detection works by scanning the post title, excerpt, and content for service-related keywords

**Post page (`/[slug]`)**
- Fetches the full post by its URL slug
- Shows the article content, featured image, tags (linking back to midcent.se search), and a "Read more on Midcent" button
- Sidebar shows 8 recent posts from midcent.se (all categories)
- Below the article shows 3 "similar articles" — matched by title keywords against the cached home page post pool
- Full Open Graph meta tags for social sharing

**Header**
- Midcent logo linking to midcent.se
- Hamburger nav with links to all main midcent.se sections
- Search icon top right — tapping it opens a full-width white dropdown panel below the header with a search input; icon switches to X when open
- Search submits to midcent.se/?s= (the main WordPress site search)
- On desktop: search icon also triggers an inline expanding input in the nav bar

### Project structure
```
streaming/
  index.html         — Base HTML: GTM, Consent Mode v2, Funding Choices, SEO meta/OG tags
  src/
    App.tsx          — Root app, routing, error boundary
    main.tsx         — Entry point
    config/
      categories.ts  — Hostname → category config map (WP category ID, meta, ogImage, filters)
    pages/
      Home.tsx       — Home page, post grid, service & time filters, OG/JSON-LD via Helmet
      PostPage.tsx   — Single post view, sidebar, similar posts, Article JSON-LD via Helmet
    components/
      Header.tsx     — Site header with nav and search (sticky on mobile)
    lib/
      wpCache.ts     — WordPress API fetch + two-layer cache
      prefetch.ts    — Prefetches article URLs on hover/touchstart via <link rel="prefetch">
    types/
      wordpress.ts   — TypeScript types for WP API responses
```

### Multi-category architecture
The app serves multiple category subdomains from one deployment. On load it reads `window.location.hostname` and looks it up in `src/config/categories.ts` to get the WordPress category ID, page title, meta description, and any custom filters.

**To add a new category page:**
1. Add a DNS CNAME for the subdomain in Cloudflare (e.g. `ekonomi.midcent.se`)
2. Add it as a custom domain in Cloudflare Pages
3. Add one entry to `CATEGORIES` in `src/config/categories.ts`
4. Push — no other code changes needed

**WordPress category IDs (midcent.se):**
| Subdomain | Category | WP ID |
|---|---|---|
| streaming.midcent.se | Underhållning (streaming content) | 1 |
| ekonomi.midcent.se | Ekonomi | 7 |
| halsa.midcent.se | Hälsa | 19 |
| teknik.midcent.se | Teknik | 8 |
| fritid.midcent.se | Fritid | 11 |
| samhalle.midcent.se | Samhälle | 13 |
| mat.midcent.se | Mat & Dryck | 25 |
| resa.midcent.se | Resa | 20 |

### Caching strategy
API responses are cached in three ways:
1. **Memory cache** (`Map`) — fastest, lives as long as the browser tab is open
2. **localStorage** — persists for 30 days across visits, keyed by API URL
3. **Cloudflare cache** — API calls to midcent.se are cached at the Cloudflare edge via a Cloudflare rule, so the WordPress server is not hit on every request

---

## Rules for Claude

### Documentation
- **Update this file continuously during a session** — not just at the end. Any time a meaningful change is made to the code, update the relevant section immediately.
- When adding a new dependency, add it to the **Dependencies** section below with a short note on why it was added.
- When adding a new page or component, add it to the **Project structure** section above.
- When changing how something looks or behaves (UI, layout, interactions), update the description under **What the site does**.
- If an important architectural decision is made (e.g. why something is built a certain way), note it under **Architecture decisions** below.
- Keep descriptions plain and short — written so anyone can understand what the project does without reading the code.

### Code style
- Keep code simple and readable — this is a project maintained by a developer still learning.
- Prefer small, focused components and functions. One responsibility per file where possible.
- Always use TypeScript types. Never use `any` unless there is a very good reason, and explain why in a comment.
- Add a short comment above any function that is not immediately obvious.

### Before making changes
- Always read the relevant file(s) before editing them.
- If a change affects how data is fetched or cached, double-check `wpCache.ts`.
- If a change affects routing, check `App.tsx`.

### When something breaks
- Check the browser console for errors first.
- The `ErrorBoundary` in `App.tsx` will catch React render errors and show a red message — note what it says.
- **White/blank page** — most likely causes in order:
  1. Browser console says `'text/html' is not a valid JavaScript MIME type` → Cloudflare CDN has cached a bad response for the JS file. Fix: Cloudflare dashboard → domain → Caching → Custom Purge → enter the specific JS file URL (e.g. `https://streaming.midcent.se/assets/index-XXXXX.js`). Do NOT purge everything — midcent.se has 2500+ pages.
  2. A React render crash — ErrorBoundary will show a red error message instead
  3. A failed API fetch or routing issue

### Git & deployment
- Write clear commit messages that describe *what changed and why*, not just what file was touched.
- Do not push directly to main without confirming with the developer first.
- After a build, the output goes to `dist/` — this is what Cloudflare Pages deploys (build output dir is set to `dist` in Pages settings).
- Cloudflare Pages build: command `npm run build`, output dir `dist`, root directory empty.

---

## Dependencies

| Package | Purpose |
|---|---|
| react, react-dom | UI framework |
| react-router-dom | Client-side routing (URL → page component) |
| react-helmet-async | Sets page `<title>` and meta tags per page |
| vite | Build tool and dev server |
| typescript | Type safety |
| eslint | Code quality checks |

---

## When to use this app vs WordPress

**Use this app for:**
- Landing pages or hub pages that need custom UI or functionality not possible in WordPress
- Pages with interactive filtering (like the streaming service filters)
- Pages with a distinct design that differs from the main midcent.se look

**Use WordPress (Elementor) for:**
- Standard category pages (Ekonomi, Hälsa, Teknik etc.)
- Pages where the content and design fits the normal midcent.se structure
- Anything where SEO is the priority and no custom functionality is needed

The streaming page is the primary example of what belongs here — the Netflix/HBO/Disney+ filtering and magazine layout is a custom solution that justifies a separate app. Standard category landing pages should be built and maintained in WordPress where SEO is stronger and everything stays in one system.

---

## Architecture decisions

- **WordPress as a headless CMS:** Content is managed in WordPress, but the frontend is a separate React app that pulls data via the WP REST API. This keeps the public-facing site fast and modern while using a familiar CMS for content editing.
- **Client-side caching:** API responses are cached in localStorage for 30 days to avoid re-fetching on every visit. The cache is keyed by URL.
- **Error boundary:** A class-based `ErrorBoundary` wraps the whole app so that if a component crashes, it shows an error message instead of a blank page. Added after a deployment of a header redesign caused a silent white page crash (March 2026).
- **Search as a dropdown panel:** The search UI opens a full-width white panel below the header rather than expanding inline. This matches the midcent.se design pattern and works cleanly on both mobile and desktop without cluttering the header bar.
- **Sticky header:** `.site-header` uses `position: sticky; top: 0; z-index: 100` so the nav stays visible while scrolling on mobile. `overflow-x: hidden` on `html` and `body` prevents horizontal drag on mobile.
- **Link prefetching:** `src/lib/prefetch.ts` injects `<link rel="prefetch">` on `mouseenter`/`touchstart` for article cards so the destination midcent.se page is already in the browser cache by the time the user clicks.
- **SEO:** Each page sets its own `<title>`, `<meta name="description">`, canonical URL, full Open Graph + Twitter Card tags, and JSON-LD structured data via `react-helmet-async`. The streaming home page targets Generation X audience. Base fallback tags are also in `index.html` for crawlers that don't execute JS.
- **Google consent integration:** `index.html` loads Google Consent Mode v2 defaults (all denied) before GTM, then GTM (GTM-KTQ6JC8), then Google Funding Choices (`pub-5936716338661368`). This is the same setup as midcent.se. Both sites are registered in Funding Choices and share the `FCCDCF` consent cookie at `.midcent.se` domain level — so a visitor who consents on either site is not asked again on the other. The Funding Choices script must appear after the Consent Mode defaults but can be alongside GTM.
