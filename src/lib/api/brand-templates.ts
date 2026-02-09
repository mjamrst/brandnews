import { createClient } from '@/lib/supabase/client';
import type { BrandTemplate, BrandTemplateInsert, BrandTemplateUpdate } from '@/lib/supabase/database.types';

export async function listBrandTemplates(): Promise<BrandTemplate[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('brand_templates')
    .select('*')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getBrandTemplate(id: string): Promise<BrandTemplate> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('brand_templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createBrandTemplate(brandTemplate: BrandTemplateInsert): Promise<BrandTemplate> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('brand_templates')
    .insert(brandTemplate)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBrandTemplate(id: string, updates: BrandTemplateUpdate): Promise<BrandTemplate> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('brand_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBrandTemplate(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('brand_templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
