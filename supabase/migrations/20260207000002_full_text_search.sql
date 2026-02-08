-- ============================================================
-- Full-Text Search on articles
-- ============================================================

-- Add tsvector column
ALTER TABLE the_brief.articles
ADD COLUMN search_vector TSVECTOR;

-- GIN index for fast full-text search
CREATE INDEX idx_articles_search ON the_brief.articles USING GIN (search_vector);

-- Function to auto-update search_vector
CREATE OR REPLACE FUNCTION the_brief.update_article_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.headline, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.source_name, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search_vector on insert or update
CREATE TRIGGER update_articles_search_vector
  BEFORE INSERT OR UPDATE OF title, headline, summary, source_name
  ON the_brief.articles
  FOR EACH ROW
  EXECUTE FUNCTION the_brief.update_article_search_vector();
