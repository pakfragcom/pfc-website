// TEMPORARY DEBUG — remove after diagnosis
export default function handler(req, res) {
  const pw = process.env.ADMIN_PASSWORD;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  res.json({
    ADMIN_PASSWORD_set: !!pw,
    ADMIN_PASSWORD_length: pw ? pw.length : 0,
    ADMIN_PASSWORD_first5: pw ? pw.slice(0, 5) : null,
    SUPABASE_URL_set: !!url,
    SUPABASE_URL_first20: url ? url.slice(0, 20) : null,
    NODE_ENV: process.env.NODE_ENV,
  });
}
