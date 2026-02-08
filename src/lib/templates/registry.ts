import type { TemplateDefinition } from './types';
import TheRundown from '@/components/templates/TheRundown';
import QuickHits from '@/components/templates/QuickHits';
import DeepDive from '@/components/templates/DeepDive';
import { renderTheRundownHtml } from './the-rundown-html';
import { renderTheRundownEmailHtml } from './the-rundown-email';
import { renderQuickHitsHtml } from './quick-hits-html';
import { renderQuickHitsEmailHtml } from './quick-hits-email';
import { renderDeepDiveHtml } from './deep-dive-html';
import { renderDeepDiveEmailHtml } from './deep-dive-email';

export const TEMPLATES: Record<string, TemplateDefinition> = {
  'the-rundown': {
    id: 'the-rundown',
    name: 'The Rundown',
    description: 'News grid with a featured hero article and a 2-column article list. Best for 7-9 articles.',
    component: TheRundown,
    renderHtml: renderTheRundownHtml,
    renderEmailHtml: renderTheRundownEmailHtml,
  },
  'quick-hits': {
    id: 'quick-hits',
    name: 'Quick Hits',
    description: 'Compact 3-column card grid. Each card shows a thumbnail, headline, and one-sentence summary. Best for 10-15 articles.',
    component: QuickHits,
    renderHtml: renderQuickHitsHtml,
    renderEmailHtml: renderQuickHitsEmailHtml,
  },
  'deep-dive': {
    id: 'deep-dive',
    name: 'Deep Dive',
    description: 'Sectioned layout with articles grouped by topic. Includes a sidebar with quick links. Best for themed newsletters.',
    component: DeepDive,
    renderHtml: renderDeepDiveHtml,
    renderEmailHtml: renderDeepDiveEmailHtml,
  },
};

export function getTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATES[id];
}

export function getTemplateList(): TemplateDefinition[] {
  return Object.values(TEMPLATES);
}
