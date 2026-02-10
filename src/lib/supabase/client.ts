import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

let client: ReturnType<typeof supabaseCreateClient<Database>> | null = null;

export function createClient() {
  if (client) return client;
  client = supabaseCreateClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: 'the_brief',
      },
    }
  );
  return client;
}
