-- ============================================================
-- Row Level Security Policies for The Brief
-- ============================================================

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION the_brief.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM the_brief.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE the_brief.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_brief.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_brief.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_brief.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_brief.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_brief.newsletter_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_brief.feed_sources ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- articles
-- ============================================================
CREATE POLICY "Authenticated users can read articles"
  ON the_brief.articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create articles"
  ON the_brief.articles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update articles"
  ON the_brief.articles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete articles"
  ON the_brief.articles FOR DELETE
  TO authenticated
  USING (the_brief.is_admin());

-- ============================================================
-- tags
-- ============================================================
CREATE POLICY "Authenticated users can read tags"
  ON the_brief.tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create tags"
  ON the_brief.tags FOR INSERT
  TO authenticated
  WITH CHECK (the_brief.is_admin());

CREATE POLICY "Admins can update tags"
  ON the_brief.tags FOR UPDATE
  TO authenticated
  USING (the_brief.is_admin())
  WITH CHECK (the_brief.is_admin());

CREATE POLICY "Admins can delete tags"
  ON the_brief.tags FOR DELETE
  TO authenticated
  USING (the_brief.is_admin());

-- ============================================================
-- article_tags
-- ============================================================
CREATE POLICY "Authenticated users can read article_tags"
  ON the_brief.article_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create article_tags"
  ON the_brief.article_tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete article_tags"
  ON the_brief.article_tags FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- profiles
-- ============================================================
CREATE POLICY "Authenticated users can read all profiles"
  ON the_brief.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON the_brief.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can create profiles"
  ON the_brief.profiles FOR INSERT
  TO authenticated
  WITH CHECK (the_brief.is_admin() OR id = auth.uid());

CREATE POLICY "Admins can delete profiles"
  ON the_brief.profiles FOR DELETE
  TO authenticated
  USING (the_brief.is_admin());

-- ============================================================
-- newsletters
-- ============================================================
CREATE POLICY "Authenticated users can read newsletters"
  ON the_brief.newsletters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can read published newsletters"
  ON the_brief.newsletters FOR SELECT
  TO anon
  USING (status = 'published');

CREATE POLICY "Authenticated users can create newsletters"
  ON the_brief.newsletters FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own newsletters or admins"
  ON the_brief.newsletters FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR the_brief.is_admin())
  WITH CHECK (created_by = auth.uid() OR the_brief.is_admin());

CREATE POLICY "Users can delete own newsletters or admins"
  ON the_brief.newsletters FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR the_brief.is_admin());

-- ============================================================
-- newsletter_articles
-- ============================================================
CREATE POLICY "Authenticated users can read newsletter_articles"
  ON the_brief.newsletter_articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can read published newsletter_articles"
  ON the_brief.newsletter_articles FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM the_brief.newsletters
      WHERE id = newsletter_id AND status = 'published'
    )
  );

CREATE POLICY "Authenticated users can manage newsletter_articles"
  ON the_brief.newsletter_articles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM the_brief.newsletters
      WHERE id = newsletter_id AND (created_by = auth.uid() OR the_brief.is_admin())
    )
  );

CREATE POLICY "Users can update newsletter_articles"
  ON the_brief.newsletter_articles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM the_brief.newsletters
      WHERE id = newsletter_id AND (created_by = auth.uid() OR the_brief.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM the_brief.newsletters
      WHERE id = newsletter_id AND (created_by = auth.uid() OR the_brief.is_admin())
    )
  );

CREATE POLICY "Users can delete newsletter_articles"
  ON the_brief.newsletter_articles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM the_brief.newsletters
      WHERE id = newsletter_id AND (created_by = auth.uid() OR the_brief.is_admin())
    )
  );

-- ============================================================
-- feed_sources
-- ============================================================
CREATE POLICY "Authenticated users can read feed_sources"
  ON the_brief.feed_sources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create feed_sources"
  ON the_brief.feed_sources FOR INSERT
  TO authenticated
  WITH CHECK (the_brief.is_admin());

CREATE POLICY "Admins can update feed_sources"
  ON the_brief.feed_sources FOR UPDATE
  TO authenticated
  USING (the_brief.is_admin())
  WITH CHECK (the_brief.is_admin());

CREATE POLICY "Admins can delete feed_sources"
  ON the_brief.feed_sources FOR DELETE
  TO authenticated
  USING (the_brief.is_admin());
