import { supabaseAdmin } from './supabase-admin';

// Resolves an existing product_variants row (fragrance + size + concentration)
// or creates one. Race-safe: if a concurrent request creates the same variant
// first, the unique constraint rejects our insert and we re-select it.
export async function resolveOrCreateVariant({ fragrance_id, size_ml, concentration }) {
  if (!fragrance_id) return null;

  const sizeNum = Number(size_ml);
  if (!Number.isInteger(sizeNum) || sizeNum <= 0 || sizeNum > 5000) return null;

  const concText = concentration?.trim() || '';

  const { data: existing } = await supabaseAdmin
    .from('product_variants')
    .select('id')
    .eq('fragrance_id', fragrance_id)
    .eq('size_ml', sizeNum)
    .eq('concentration', concText)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created } = await supabaseAdmin
    .from('product_variants')
    .insert({ fragrance_id, size_ml: sizeNum, concentration: concText })
    .select('id')
    .maybeSingle();
  if (created) return created.id;

  const { data: retry } = await supabaseAdmin
    .from('product_variants')
    .select('id')
    .eq('fragrance_id', fragrance_id)
    .eq('size_ml', sizeNum)
    .eq('concentration', concText)
    .maybeSingle();
  return retry?.id || null;
}
