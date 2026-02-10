import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { publishNewsletter } from '@/lib/publishing/publish';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    // Verify newsletter exists
    const { data: newsletter, error: fetchError } = await supabase
      .from('newsletters')
      .select('id, created_by, status')
      .eq('id', id)
      .single();

    if (fetchError || !newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
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
