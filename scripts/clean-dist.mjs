import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// `tsc` never empties its own `outDir`, so output from a source file that has since been
// renamed or deleted survives every later build and is published as part of the tarball.
// Removing the directory first makes `dist` a function of the current sources alone.
//
// This deliberately reimplements one line of `src/clean.ts` instead of importing it: the
// build is what produces the runnable package, so it cannot depend on the package's own
// build output without a bootstrap cycle. See docs/decisions.md.
const distribution = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

await rm(distribution, { recursive: true, force: true });
