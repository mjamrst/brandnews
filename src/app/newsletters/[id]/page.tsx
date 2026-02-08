import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { fetchNewsletterData } from '@/lib/publishing/publish';
import { getTemplate } from '@/lib/templates/registry';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const data = await fetchNewsletterData(supabase, id);

  if (!data || !data.published_at) {
    return { title: 'Newsletter Not Found' };
  }

  const firstArticle = data.articles[0];
  const description = firstArticle
    ? (firstArticle.custom_headline || firstArticle.headline || firstArticle.title)
    : 'Newsletter from The Brief';
  const image = firstArticle?.thumbnail_url || undefined;

  return {
    title: data.title,
    description,
    openGraph: {
      title: data.title,
      description,
      type: 'article',
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function NewsletterPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const data = await fetchNewsletterData(supabase, id);

  if (!data || !data.published_at) {
    notFound();
  }

  const template = getTemplate(data.template_id);
  if (!template) {
    notFound();
  }

  const TemplateComponent = template.component;

  return (
    <div className="min-h-screen bg-gray-50">
      <TemplateComponent newsletter={data} />
    </div>
  );
}
