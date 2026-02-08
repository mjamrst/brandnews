import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify newsletter exists
    const { data: newsletter, error: fetchError } = await supabase
      .from('newsletters')
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (fetchError || !newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    // Check ownership or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (newsletter.created_by !== user.id && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('newsletters')
      .update({
        status: 'draft',
        published_at: null,
        published_url: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ newsletter: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
