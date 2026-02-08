-- Fix schema grants for the_brief (ensure API access works)
GRANT USAGE ON SCHEMA the_brief TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA the_brief TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA the_brief TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA the_brief TO anon, authenticated;

-- Future tables automatically get permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA the_brief
GRANT ALL ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA the_brief
GRANT ALL ON SEQUENCES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA the_brief
GRANT ALL ON ROUTINES TO anon, authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
