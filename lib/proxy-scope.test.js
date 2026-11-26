import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Since Next 16, proxy.js runs on the Node.js runtime: every request it
// matches is a function invocation billed as Fluid Active CPU. In Nov 2026 it
// matched every page view and used up the Hobby plan's monthly 4 CPU-hours.
// It must stay scoped to API routes (see the comment in proxy.js).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'proxy.js'), 'utf8');

describe('proxy.js only runs on API routes', () => {
  it("matcher is exactly ['/api/:path*']", () => {
    const m = src.match(/matcher:\s*(\[[^\]]*\])/);
    expect(m, 'proxy.js must export config.matcher').toBeTruthy();
    const entries = [...m[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map((x) => x[1]);
    expect(entries).toEqual(['/api/:path*']);
  });
});
