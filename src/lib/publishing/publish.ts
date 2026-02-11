import { getTemplate } from '@/lib/templates/registry';
import { extractBrandConfig } from '@/lib/templates/brand';
import type { NewsletterData, TemplateArticle } from '@/lib/templates/types';

const STORAGE_BUCKET = 'newsletters';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

/**
 * Fetch full newsletter data (with articles) from Supabase, ready for rendering.
 */
export async function fetchNewsletterData(
  supabase: SupabaseClient,
  newsletterId: string,
): Promise<NewsletterData> {
  const { data: newsletter, error: nErr } = await supabase
    .from('newsletters')
    .select('*')
    .eq('id', newsletterId)
    .single();

  if (nErr || !newsletter) {
    console.error('[publish] Newsletter query failed:', nErr?.message);
    throw new Error(`Newsletter query failed: ${nErr?.message || 'not found'}`);
  }

  const { data: articleRows, error: aErr } = await supabase
    .from('newsletter_articles')
    .select(`
      position,
      section,
      custom_headline,
      custom_summary,
      articles (
        id,
        url,
        title,
        headline,
        summary,
        thumbnail_url,
        source_name
      )
    `)
    .eq('newsletter_id', newsletterId)
    .order('position', { ascending: true });

  if (aErr || !articleRows) {
    console.error('[publish] Articles query failed:', aErr?.message);
    throw new Error(`Articles query failed: ${aErr?.message || 'no data'}`);
  }

  const articles: TemplateArticle[] = [];
  for (const row of articleRows as Record<string, unknown>[]) {
    const article = row.articles as Record<string, unknown>;
    if (!article) continue;

    const { data: tagRows } = await supabase
      .from('article_tags')
      .select('tags ( name )')
      .eq('article_id', article.id as string);

    const tags = (tagRows ?? [])
      .map((t: Record<string, unknown>) => {
        const tag = t.tags as Record<string, string> | null;
        return tag?.name ?? '';
      })
      .filter(Boolean);

    articles.push({
      id: article.id as string,
      url: article.url as string,
      title: article.title as string,
      headline: (article.headline as string) ?? null,
      summary: (article.summary as string) ?? null,
      thumbnail_url: (article.thumbnail_url as string) ?? null,
      source_name: (article.source_name as string) ?? null,
      tags,
      position: row.position as number,
      section: (row.section as string) ?? null,
      custom_headline: (row.custom_headline as string) ?? null,
      custom_summary: (row.custom_summary as string) ?? null,
      why_it_matters: null,
    });
  }

  const brandConfig = extractBrandConfig(
    newsletter.config as Record<string, unknown> | null,
  );

  return {
    id: newsletter.id as string,
    title: newsletter.title as string,
    template_id: newsletter.template_id as string,
    brand_config: brandConfig,
    articles,
    created_at: newsletter.created_at as string,
    published_at: (newsletter.published_at as string) ?? null,
  };
}

/**
 * Publish a newsletter: render HTML, upload to Storage, update status.
 */
export async function publishNewsletter(
  supabase: SupabaseClient,
  newsletterId: string,
): Promise<{ url: string }> {
  const data = await fetchNewsletterData(supabase, newsletterId);

  const template = getTemplate(data.template_id);
  if (!template) throw new Error(`Unknown template: ${data.template_id}`);

  const html = template.renderHtml(data);
  const filePath = `${newsletterId}/index.html`;

  // Upload to Supabase Storage
  const { error: uploadErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, html, {
      contentType: 'text/html',
      upsert: true,
    });

  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

  // Use the app's own route for the public URL (renders with React)
  const publicUrl = `/newsletters/${newsletterId}`;

  // Update newsletter record
  const { error: updateErr } = await supabase
    .from('newsletters')
    .update({
      status: 'published',
      published_url: publicUrl,
      published_at: new Date().toISOString(),
    })
    .eq('id', newsletterId);

  if (updateErr) throw new Error(`Update failed: ${updateErr.message}`);

  return { url: publicUrl };
}
