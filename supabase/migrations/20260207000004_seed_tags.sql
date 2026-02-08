-- ============================================================
-- Seed Tags for The Brief
-- ============================================================

INSERT INTO the_brief.tags (name, category) VALUES
  -- Topics
  ('sports', 'topic'),
  ('entertainment', 'topic'),
  ('culture', 'topic'),
  ('music', 'topic'),
  ('gaming', 'topic'),
  ('esports', 'topic'),
  ('fashion', 'topic'),
  -- Industry
  ('sports-sponsorship', 'industry'),
  ('brand-partnerships', 'industry'),
  ('experiential', 'industry'),
  ('media-rights', 'industry'),
  ('NIL', 'industry'),
  -- Technology
  ('AI', 'technology'),
  ('AR', 'technology'),
  ('VR', 'technology'),
  ('emerging-tech', 'technology'),
  ('Web3', 'technology'),
  ('blockchain', 'technology'),
  ('wearables', 'technology'),
  ('streaming', 'technology')
ON CONFLICT (name) DO NOTHING;
