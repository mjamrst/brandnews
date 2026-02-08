-- ============================================================
-- The Brief — Schema & Tables
-- All tables in the `the_brief` schema (shared Supabase project)
-- ============================================================

-- Create the schema
CREATE SCHEMA IF NOT EXISTS the_brief;

-- Grant permissions to Supabase roles
GRANT USAGE ON SCHEMA the_brief TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA the_brief TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA the_brief TO anon, authenticated;

-- Future tables automatically get permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA the_brief
GRANT ALL ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA the_brief
GRANT ALL ON SEQUENCES TO anon, authenticated;

-- ============================================================
-- articles
-- ============================================================
CREATE TABLE the_brief.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  headline TEXT,                    -- AI-generated catchy headline
  summary TEXT,                     -- AI-generated 2-3 sentence overview
  thumbnail_url TEXT,
  source_name TEXT,                 -- e.g., "TechCrunch", "ESPN"
  source_favicon TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  ingested_by TEXT,                 -- 'auto' or user UUID
  raw_content TEXT,                 -- scraped article text for AI processing
  status TEXT DEFAULT 'active',     -- active, archived, flagged
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for URL deduplication lookups
CREATE INDEX idx_articles_url ON the_brief.articles (url);
-- Index for status filtering
CREATE INDEX idx_articles_status ON the_brief.articles (status);
-- Index for date sorting
CREATE INDEX idx_articles_published_at ON the_brief.articles (published_at DESC NULLS LAST);
CREATE INDEX idx_articles_ingested_at ON the_brief.articles (ingested_at DESC);

-- ============================================================
-- tags
-- ============================================================
CREATE TABLE the_brief.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,        -- lowercase, normalized
  category TEXT,                    -- 'topic', 'industry', 'technology'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tags_category ON the_brief.tags (category);

-- ============================================================
-- article_tags (many-to-many)
-- ============================================================
CREATE TABLE the_brief.article_tags (
  article_id UUID REFERENCES the_brief.articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES the_brief.tags(id) ON DELETE CASCADE,
  source TEXT DEFAULT 'ai',         -- 'ai' or 'manual'
  PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX idx_article_tags_tag_id ON the_brief.article_tags (tag_id);

-- ============================================================
-- profiles (app-specific user data, references auth.users)
-- ============================================================
CREATE TABLE the_brief.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  team TEXT,                        -- optional team label
  role TEXT DEFAULT 'editor',       -- 'admin', 'editor'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- newsletters
-- ============================================================
CREATE TABLE the_brief.newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  created_by UUID REFERENCES the_brief.profiles(id),
  template_id TEXT NOT NULL,              -- template key: 'the-rundown', 'quick-hits', 'deep-dive'
  brand_template TEXT,                    -- optional brand override key
  status TEXT DEFAULT 'draft',            -- draft, published
  published_url TEXT,                     -- shareable link when published
  published_at TIMESTAMPTZ,
  config JSONB,                           -- layout config, color overrides, header text
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_newsletters_status ON the_brief.newsletters (status);
CREATE INDEX idx_newsletters_created_by ON the_brief.newsletters (created_by);

-- ============================================================
-- newsletter_articles (join table with ordering)
-- ============================================================
CREATE TABLE the_brief.newsletter_articles (
  newsletter_id UUID REFERENCES the_brief.newsletters(id) ON DELETE CASCADE,
  article_id UUID REFERENCES the_brief.articles(id),
  position INTEGER NOT NULL,              -- order in the newsletter
  section TEXT,                           -- optional section grouping
  custom_headline TEXT,                   -- override AI headline
  custom_summary TEXT,                    -- override AI summary
  PRIMARY KEY (newsletter_id, article_id)
);

-- ============================================================
-- feed_sources
-- ============================================================
CREATE TABLE the_brief.feed_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,               -- RSS feed URL
  feed_type TEXT DEFAULT 'rss',           -- rss, atom
  active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  fetch_interval_minutes INTEGER DEFAULT 120,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- updated_at trigger function (reusable)
-- ============================================================
CREATE OR REPLACE FUNCTION the_brief.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_articles_updated_at
  BEFORE UPDATE ON the_brief.articles
  FOR EACH ROW EXECUTE FUNCTION the_brief.update_updated_at();

CREATE TRIGGER set_newsletters_updated_at
  BEFORE UPDATE ON the_brief.newsletters
  FOR EACH ROW EXECUTE FUNCTION the_brief.update_updated_at();
