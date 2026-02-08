import juice from 'juice';
import { getTemplate } from '@/lib/templates/registry';
import { fetchNewsletterData } from './publish';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

/**
 * Generate email-compatible HTML for a newsletter.
 * Uses Juice to inline all CSS for maximum email client compatibility.
 */
export async function exportEmailHtml(
  supabase: SupabaseClient,
  newsletterId: string,
): Promise<string> {
  const data = await fetchNewsletterData(supabase, newsletterId);
  if (!data) throw new Error('Newsletter not found');

  const template = getTemplate(data.template_id);
  if (!template) throw new Error(`Unknown template: ${data.template_id}`);

  const rawHtml = template.renderEmailHtml(data);

  // Inline all CSS using Juice
  const inlinedHtml = juice(rawHtml, {
    preserveMediaQueries: true,
    preserveFontFaces: true,
    applyStyleTags: true,
    removeStyleTags: false,
    preserveImportant: true,
  });

  return inlinedHtml;
}
