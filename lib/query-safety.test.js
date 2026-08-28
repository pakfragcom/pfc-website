import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Regression guard for the Fluid Active CPU incident (see CLAUDE.md): an API
// route ran two unbounded full-table Supabase fetches on every homepage
// view, which quietly burned through the Vercel Hobby CPU budget over
// weeks. This scans every pages/api route for `.from('table')` calls with
// no bounding clause nearby, so the same class of bug fails CI instead of
// shipping.
//
// Deliberately unbounded, already-reviewed queries (small admin-only
// tables where a full aggregate is the actual intent, not an oversight) —
// add here only after checking the table's expected size and traffic.
const ALLOWLIST = [
  { file: 'pages/api/admin/sellers.js', table: 'sellers' },
  { file: 'pages/api/admin/stats.js', table: 'sellers' },
  { file: 'pages/api/admin/stats.js', table: 'subscriptions' },
  // Flat listing, no status tabs — fragrance_houses is a small, admin-curated
  // table where "all houses" is the actual intent, not an oversight.
  { file: 'pages/api/admin/houses.js', table: 'fragrance_houses' },
];

const BOUNDING_MARKERS = ['.limit(', '.single()', '.maybeSingle()', '.range(', 'head: true', 'head:true'];
// A .eq('*_id', someValue) scopes to one owner's rows (a user's own likes,
// a seller's own inventory, one row by primary key) — fundamentally bounded
// even without .limit(), unlike a blanket full-table fetch.
const OWNER_SCOPE_PATTERN = /\.eq\(\s*['"]\w*_id['"]/;
// Write operations are scoped by their own payload/eq() clause, not by a
// read-side bounding marker — a plain .insert()/.update()/.upsert()/.delete()
// is never the "fetch the whole table" bug this test guards against.
const WRITE_MARKERS = ['.insert(', '.update(', '.upsert(', '.delete('];
const LOOKAHEAD_LINES = 15;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const apiRoot = path.join(repoRoot, 'pages', 'api');

function findJsFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(findJsFiles(full));
    else if (entry.name.endsWith('.js')) results.push(full);
  }
  return results;
}

describe('API routes never run an unbounded Supabase query', () => {
  const files = findJsFiles(apiRoot);

  for (const file of files) {
    const relFile = path.relative(repoRoot, file).split(path.sep).join('/');
    const lines = fs.readFileSync(file, 'utf8').split('\n');

    lines.forEach((line, i) => {
      const match = line.match(/\.from\(\s*['"]([\w]+)['"]\s*\)/);
      if (!match) return;
      const table = match[1];

      it(`${relFile}:${i + 1} — .from('${table}') is bounded or allowlisted`, () => {
        const window = lines.slice(i, i + LOOKAHEAD_LINES).join('\n');
        const isWrite = WRITE_MARKERS.some(marker => window.includes(marker));
        const isBounded = BOUNDING_MARKERS.some(marker => window.includes(marker)) || OWNER_SCOPE_PATTERN.test(window);
        const isAllowlisted = ALLOWLIST.some(a => a.file === relFile && a.table === table);

        if (!isWrite && !isBounded && !isAllowlisted) {
          throw new Error(
            `${relFile}:${i + 1} queries "${table}" with no .limit()/.single()/.maybeSingle()/` +
            `.range()/count head:true nearby. If this is intentional (e.g. a small admin-only ` +
            `table where a full aggregate is the point), add it to ALLOWLIST in this file with a ` +
            `one-line reason — otherwise bound the query.`
          );
        }
        expect(true).toBe(true);
      });
    });
  }
});
