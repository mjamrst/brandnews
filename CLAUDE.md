# The Brief — Trends & Insights Newsletter Factory

## Project Overview
"The Brief" is an internal web application for a global sports and entertainment agency. It serves 8-10 marketing teams who create weekly/monthly newsletters for brand clients. The app provides a shared, searchable article library and one-click newsletter generation powered by AI.

## Tech Stack
- **Frontend**: React (Next.js) + Tailwind CSS + shadcn/ui
- **Backend/Database**: Supabase (Postgres, Auth, Storage, Edge Functions)
- **AI**: Anthropic Claude API (summaries, headlines, tagging) — use claude-sonnet-4-5-20250929
- **Deployment**: Vercel
- **Scraping**: Cheerio + Puppeteer (JS-rendered page fallback)

## Architecture
```
┌─────────────────────────────────────────────────────┐
│                    THE BRIEF                         │
├──────────────┬──────────────┬───────────────────────┤
│  INGESTION   │   LIBRARY    │   NEWSLETTER BUILDER  │
│              │              │                       │
│ RSS Feeds ──►│  Search &    │  Select Stories ──►   │
│ Manual URLs─►│  Browse      │  Choose Template ──►  │
│ Scrape ─────►│  Filter Tags │  AI Generates Copy ──►│
│ AI Enrich ──►│  Curate      │  Preview & Publish    │
└──────────────┴──────────────┴───────────────────────┘
                       │
              ┌────────┴────────┐
              │    SUPABASE     │
              │  Postgres + Auth│
              │  + Storage      │
              └─────────────────┘
```

## Full Specification
See `docs/SPEC.md` for the complete project specification including database schema, feature specs, templates, and RSS feed sources.

## Agent Team Structure

This project uses 4 specialized agents:

### Agent 1: "Data Layer" — Database & API
**Scope:** Supabase schema, migrations, RLS policies, Edge Functions, API routes.
- Set up Supabase project config
- Create all database tables (see schema in docs/SPEC.md)
- Row Level Security policies
- CRUD API routes for articles, tags, newsletters
- Full-text search (Postgres tsvector + GIN indexes)
- RSS feed polling Edge Function
- URL scraping + AI enrichment Edge Function
- Username/password auth via Supabase Auth (no OAuth, no email verification)

### Agent 2: "Ingestion Engine" — Scraping, AI, Content Pipeline
**Scope:** Getting articles into the system and enriching them with AI.
- Web scraper: Cheerio (standard) + Puppeteer fallback (JS-heavy)
- Claude API integration for enrichment (summary, headline, auto-tagging)
- RSS feed parser (RSS 2.0 + Atom, deduplication, rate limiting)
- Manual URL submission handler
- Retry logic, graceful failure handling
- Rate limit scraping (1-2s delays)

### Agent 3: "Frontend" — Library & Builder UI
**Scope:** All React components, pages, and client-side logic.
- Layout & navigation (sidebar, top bar, responsive)
- Login page (username/password)
- Article Library (card grid, search, filter, tag management, bulk select)
- Newsletter Builder (article staging, live preview, template selector, inline editing)
- Newsletter Management (list, status, shareable links, HTML export)
- Admin pages (feeds, brands, users, tags)
- Design: modern/clean (Linear/Notion aesthetic), Tailwind + shadcn/ui

### Agent 4: "Newsletter Renderer" — Templates & Publishing
**Scope:** Template system, rendering engine, publishing pipeline.
- 3 grid templates: The Rundown, Quick Hits, Deep Dive
- Each renders as: React component, static HTML page, email-compatible HTML
- Brand template system (logo, colors, footer — JSON config overlays)
- Publishing pipeline (render → Supabase Storage → public URL)
- HTML email export (table-based, inline CSS, use Juice)
- Public newsletter page route `/newsletters/[id]`

## Agent Dependency Order
```
Agent 1 (Data Layer) ────────►
                    Agent 2 (Ingestion) ──────►
Agent 3 (Frontend — mock data) ──► Agent 3 (integrate real API) ──►
                         Agent 4 (Templates + Publish) ──────────►
```

- Start Agent 1 first — schema and API are the foundation
- Agent 3 can start in parallel with mock data
- Agent 2 starts once schema is in place
- Agent 4 starts once the article data model is stable

## Coding Conventions
- Use TypeScript throughout
- Use Supabase client libraries, not raw SQL in the frontend
- Tailwind CSS for all styling
- shadcn/ui for UI components
- No Lovable — all hand-coded React components
- Store raw article content so AI enrichment can be re-run later
- All routes behind auth except published newsletter pages
