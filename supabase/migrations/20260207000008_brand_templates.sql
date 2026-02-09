-- Create brand_templates table for newsletter brand customization
CREATE TABLE the_brief.brand_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  header_image_url TEXT,
  partner_logos JSONB DEFAULT '[]',
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#666666',
  accent_color TEXT DEFAULT '#0066FF',
  heading_font TEXT DEFAULT 'Inter',
  body_font TEXT DEFAULT 'Inter',
  subtitle TEXT,
  footer_text TEXT,
  brand_description TEXT,
  default_template_id TEXT DEFAULT 'the-rundown',
  show_why_it_matters BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE the_brief.brand_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read brand templates
CREATE POLICY "brand_templates_select" ON the_brief.brand_templates
  FOR SELECT TO authenticated USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "brand_templates_insert" ON the_brief.brand_templates
  FOR INSERT TO authenticated WITH CHECK (the_brief.is_admin());

CREATE POLICY "brand_templates_update" ON the_brief.brand_templates
  FOR UPDATE TO authenticated USING (the_brief.is_admin());

CREATE POLICY "brand_templates_delete" ON the_brief.brand_templates
  FOR DELETE TO authenticated USING (the_brief.is_admin());
