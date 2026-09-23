#!/usr/bin/env node
/** Offline eval for the committee assistant (contract fixtures + handler checks). */
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = join(process.cwd(), 'node_modules', '.cache', 'eval-ai');
mkdirSync(dir, { recursive: true });
const outfile = join(dir, 'runChecks.mjs');

await build({
  entryPoints: ['src/lib/ai/runChecks.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile,
  packages: 'external',
  logLevel: 'silent'
});

const mod = await import(pathToFileURL(outfile).href);
const code = await mod.runAiChecks();
process.exit(code);
