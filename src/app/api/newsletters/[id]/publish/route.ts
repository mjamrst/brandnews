import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { publishNewsletter } from '@/lib/publishing/publish';

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

    // Verify newsletter exists and user has access
    const { data: newsletter, error: fetchError } = await supabase
      .from('newsletters')
      .select('id, created_by, status')
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

    // Render HTML, upload to Storage, update status
    const result = await publishNewsletter(supabase, id);

    return NextResponse.json({
      newsletter: { ...newsletter, status: 'published', published_url: result.url },
      url: result.url,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
