-- ============================================================
-- Auto-create profile when a new user signs up
-- ============================================================

CREATE OR REPLACE FUNCTION the_brief.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO the_brief.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email, 'User'),
    'editor'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Only one trigger per event on auth.users can exist.
-- If another app already has a trigger, this may need to be combined.
-- Check existing triggers before running:
--   SELECT * FROM information_schema.triggers WHERE event_object_table = 'users';
CREATE TRIGGER on_auth_user_created_the_brief
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION the_brief.handle_new_user();
