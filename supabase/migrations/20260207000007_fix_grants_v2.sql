-- Grant schema access to all Supabase roles
GRANT USAGE ON SCHEMA the_brief TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA the_brief TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA the_brief TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA the_brief TO anon, authenticated, service_role;

-- Also grant to postgres role (owner)
GRANT USAGE ON SCHEMA the_brief TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA the_brief TO postgres;

-- Ensure default privileges cover future objects for all roles
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA the_brief
GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA the_brief
GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA the_brief
GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
