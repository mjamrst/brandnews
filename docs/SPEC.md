# Trends & Insights Newsletter Factory — Full Specification

## Project Overview
Build an internal web application called **"The Brief"** — a centralized trends and insights platform for a global sports and entertainment agency. The app serves 8-10 marketing teams who currently create weekly/monthly newsletters manually for brand clients. The Brief replaces that workflow with a shared, searchable, constantly-updated article library and one-click newsletter generation.

**Core value prop:** Teams browse a curated feed of tagged articles, select the ones relevant to their client, and instantly generate polished newsletter outputs — hosted web pages with shareable links and HTML email templates — powered by AI-generated summaries, headlines, and smart tagging.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Next.js) + Tailwind CSS |
| Backend/Database | Supabase (Postgres, Auth, Storage, Edge Functions) |
| AI | Anthropic Claude API (summaries, headlines, tagging) |
| Deployment | Vercel |
| Scraping | Cheerio + Puppeteer (for JS-rendered pages) |

## Database Schema (Supabase/Postgres)

### `articles`
```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  headline TEXT,              -- AI-generated catchy headline
  summary TEXT,               -- AI-generated 2-3 sentence overview
  thumbnail_url TEXT,
  source_name TEXT,           -- e.g., "TechCrunch", "ESPN"
  source_favicon TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  ingested_by TEXT,           -- 'auto' or user_id
  raw_content TEXT,           -- scraped article text for AI processing
  status TEXT DEFAULT 'active', -- active, archived, flagged
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `tags`
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,  -- lowercase, normalized
  category TEXT,              -- 'topic', 'industry', 'technology'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed tags:
-- Topics: sports, entertainment, culture, music, gaming, esports, fashion
-- Industry: sports-sponsorship, brand-partnerships, experiential, media-rights, NIL
-- Technology: AI, AR, VR, emerging-tech, Web3, blockchain, wearables, streaming
```

### `article_tags`
```sql
CREATE TABLE article_tags (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  source TEXT DEFAULT 'ai',   -- 'ai' or 'manual'
  PRIMARY KEY (article_id, tag_id)
);
```

### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  team TEXT,                  -- optional team label
  role TEXT DEFAULT 'editor', -- 'admin', 'editor'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `newsletters`
```sql
CREATE TABLE newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  template_id TEXT NOT NULL,        -- references template key
  brand_template TEXT,              -- optional brand override (e.g., 'google', 'sofi')
  status TEXT DEFAULT 'draft',      -- draft, published
  published_url TEXT,               -- shareable link when published
  published_at TIMESTAMPTZ,
  config JSONB,                     -- layout config, color overrides, header text
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `newsletter_articles`
```sql
CREATE TABLE newsletter_articles (
  newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id),
  position INTEGER NOT NULL,        -- order in the newsletter
  section TEXT,                     -- optional section grouping
  custom_headline TEXT,             -- override AI headline
  custom_summary TEXT,              -- override AI summary
  PRIMARY KEY (newsletter_id, article_id)
);
```

### `feed_sources`
```sql
CREATE TABLE feed_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,         -- RSS feed URL
  feed_type TEXT DEFAULT 'rss',     -- rss, atom
  active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  fetch_interval_minutes INTEGER DEFAULT 120,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## MVP Feature Spec

### 1. Content Ingestion Engine

**Auto-ingestion (RSS/scraping):**
- Admin panel to add/manage RSS feed sources
- Background job (Supabase Edge Function or cron) runs every 2-3 hours
- For each new article found:
  1. Check URL doesn't already exist in `articles`
  2. Fetch full page content (Cheerio for static, Puppeteer fallback for JS-rendered)
  3. Extract: title, thumbnail/OG image, author, publish date, body text
  4. Send body text to Claude API for:
     - **Summary**: 2-3 sentence overview suitable for a newsletter card
     - **Headline**: Punchy, engaging rewrite of the original title
     - **Tags**: Auto-assign from the existing tag taxonomy
  5. Store everything in `articles` + `article_tags`

**Manual submission:**
- Simple form: paste a URL, click "Add"
- System scrapes the URL and runs the same AI enrichment pipeline
- User can immediately edit the AI-generated headline, summary, and tags
- Optional: paste-in for articles behind paywalls (paste article text directly)

**AI Enrichment Prompt (for Claude API):**
```
You are a trends analyst at a leading sports and entertainment marketing agency. Given the following article, provide:

1. HEADLINE: A concise, engaging headline (max 12 words) that would grab the attention of brand marketers and sponsorship professionals.

2. SUMMARY: A 2-3 sentence overview that explains why this matters for brands investing in sports, entertainment, and culture. Focus on the strategic implications, not just what happened.

3. TAGS: Select all applicable tags from this list: [insert current tag taxonomy]. Return as a JSON array.

Article title: {title}
Article source: {source}
Article text: {body_text}

Respond in JSON format:
{
  "headline": "...",
  "summary": "...",
  "tags": ["tag1", "tag2", ...]
}
```

### 2. Article Library (The Feed)

**Main view — searchable, filterable article feed:**
- Card-based grid layout showing:
  - Thumbnail image
  - AI-generated headline
  - Source name + favicon + publish date
  - Tag pills (clickable to filter)
  - AI summary (expandable)
  - "Add to Newsletter" button
- **Search**: Full-text search across headlines, summaries, source names
- **Filter sidebar**:
  - Tag multi-select (grouped by category: Topics, Industry, Technology)
  - Date range picker
  - Source filter
  - Status filter (active/archived)
- **Sort**: Most recent (default), most selected, alphabetical
- **Bulk actions**: Select multiple → add to newsletter, archive, re-tag

**Article detail/edit view:**
- View full AI-generated content
- Edit headline, summary, tags inline
- See original article link
- View selection history (which newsletters used this article)

### 3. Newsletter Builder

**Creation flow:**
1. User clicks "New Newsletter"
2. Names the newsletter (e.g., "AI in Sports — Week of Jan 15")
3. Selects a grid template (see templates below)
4. Optionally selects a brand template (adds logo, brand colors)
5. Articles already marked "Add to Newsletter" appear in a staging area
6. User can also search/browse the library and add more articles
7. Drag-and-drop to reorder articles within the template grid
8. Edit any headline or summary inline before publishing
9. Preview the newsletter in both web and email format
10. Publish → generates shareable URL + downloadable HTML email

**Grid Templates (MVP — 3 templates):**

**Template A: "The Rundown" (News Grid)**
- Header banner with newsletter title + date + optional brand logo
- 1 featured/hero article (large thumbnail + full summary)
- 6-8 articles in a 2-column grid (thumbnail left, headline + summary right)
- Footer with agency branding

**Template B: "Quick Hits" (Compact Cards)**
- Header banner
- All articles as equal-sized cards in a 3-column masonry grid
- Each card: thumbnail, headline, 1-sentence summary, source tag
- Great for 10-15 article roundups

**Template C: "Deep Dive" (Sectioned)**
- Header banner
- Articles grouped by section/tag (e.g., "AI & Technology", "Sponsorship Moves", "Culture & Entertainment")
- Each section has a section header
- Articles within sections: thumbnail + headline + full summary
- Sidebar with "Quick Links" to all articles

**Brand Templates:**
- Brand templates are overlays on top of grid templates
- They modify: header logo, color palette (primary, secondary, accent), footer text
- Admin can create brand templates by uploading a logo and setting hex colors
- Stored as JSONB config in the `newsletters` table
- Examples: Google, SoFi, etc.

### 4. Newsletter Output

**Hosted Web Page:**
- Each published newsletter gets a unique URL: `app.thebrief.agency/newsletters/{id}`
- Clean, responsive web page rendering the chosen template
- No login required to view (public shareable link)
- Includes "Powered by [Agency]" footer
- Open Graph meta tags for nice social sharing previews

**HTML Email Export:**
- "Download HTML Email" button generates an email-compatible HTML file
- Uses table-based layout for email client compatibility
- Inline CSS (no external stylesheets)
- All images referenced as absolute URLs
- Tested for Gmail, Outlook, Apple Mail rendering patterns
- User can copy-paste into their email platform or download the .html file

## Recommended RSS Feed Sources (Starter Set)

| Source | Category | Feed URL |
|--------|----------|----------|
| TechCrunch | AI/Tech | https://techcrunch.com/feed/ |
| The Verge | Tech/Culture | https://www.theverge.com/rss/index.xml |
| ESPN | Sports | https://www.espn.com/espn/rss/news |
| SportTechie | Sports Tech | https://www.sporttechie.com/feed |
| Marketing Dive | Marketing | https://www.marketingdive.com/feeds/news/ |
| AdAge | Advertising | https://adage.com/feed |
| Digiday | Media/Marketing | https://digiday.com/feed/ |
| Front Office Sports | Sports Business | https://frontofficesports.com/feed/ |
| Billboard | Music/Entertainment | https://www.billboard.com/feed/ |
| Wired | Tech/Culture | https://www.wired.com/feed/rss |

## Development Phases

### Phase 1 — MVP (This Build)
- Supabase schema + auth
- RSS auto-ingestion with AI enrichment
- Manual URL submission
- Article library with search, filter, tag management
- Newsletter builder with 3 grid templates
- Hosted web page output with shareable link
- HTML email export

### Phase 2 — Enhancements
- PowerPoint export (use `pptx` npm package)
- Brand template admin UI with logo upload
- Newsletter analytics (view count on shared links)
- "Suggested articles" — AI recommends articles based on newsletter topic
- Email send integration (SendGrid or Resend)
- Slack notifications when new articles are ingested

### Phase 3 — Scale
- Team workspaces with separate newsletter drafts
- Client-specific portals (clients can view their newsletter archive)
- Article commenting/notes for team collaboration
- Custom RSS source per team
- Newsletter scheduling (auto-publish on a set date)
- Mobile-optimized article review experience

## Non-Functional Requirements
- **Performance**: Article library should load in under 2 seconds with 1000+ articles
- **Search**: Full-text search results in under 500ms
- **Reliability**: Scraping failures should not block the pipeline — log errors, skip article, continue
- **Security**: All routes behind auth except published newsletter pages
- **Data**: Store raw article content so AI enrichment can be re-run with improved prompts later
