import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Regression guard for the recurring Vercel Hobby Fluid Active CPU overage
// (see CLAUDE.md "Fluid Active CPU guardrail" and INFRA.md): every ISR page
// is a serverless function that re-runs on every revalidation, and the
// aggregate cost across many pages is what burns the 4-CPU-hour/month
// Hobby allowance. iso/explore.js revalidating every 180s — far more often
// than every other ISR page (600s-3600s) despite slow-changing data — was
// one contributor. This test stops a future page from reintroducing an
// unusually frequent revalidate window without a documented reason.
const MIN_REVALIDATE_SECONDS = 600;

// Pages that genuinely need fresher data than the floor allows — add here
// only with a one-line reason, not as a way to silence a failing test.
const ALLOWLIST = [];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const pagesRoot = path.join(repoRoot, 'pages');
const apiRoot = path.join(pagesRoot, 'api');

function findJsFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(findJsFiles(full));
    else if (entry.name.endsWith('.js')) results.push(full);
  }
  return results;
}

describe('ISR pages revalidate no more often than every 10 minutes', () => {
  const files = findJsFiles(pagesRoot).filter(f => !f.startsWith(apiRoot));

  for (const file of files) {
    const relFile = path.relative(repoRoot, file).split(path.sep).join('/');
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('getStaticProps')) continue;

    const matches = [...content.matchAll(/revalidate:\s*(\d+)/g)];

    matches.forEach((match, i) => {
      const seconds = Number(match[1]);

      it(`${relFile} — revalidate #${i + 1} (${seconds}s) is >= ${MIN_REVALIDATE_SECONDS}s or allowlisted`, () => {
        const isAllowlisted = ALLOWLIST.some(a => a.file === relFile);

        if (seconds < MIN_REVALIDATE_SECONDS && !isAllowlisted) {
          throw new Error(
            `${relFile} revalidates every ${seconds}s, below the ${MIN_REVALIDATE_SECONDS}s floor. ` +
            `Frequent ISR regeneration is a direct Fluid Active CPU cost (see CLAUDE.md's Fluid Active ` +
            `CPU guardrail). If this page genuinely needs fresher data than that, add it to ALLOWLIST ` +
            `in this file with a one-line reason — otherwise raise the revalidate window.`
          );
        }
        expect(true).toBe(true);
      });
    });
  }
});
