import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Inserts or refreshes the canonical set of concepts (75 topics).
 * Implementation deferred.
 */
export async function runSeed(): Promise<void> {
  throw new Error('Not implemented');
}

const thisFile = fileURLToPath(import.meta.url);
const entry = process.argv[1];
const isDirectRun =
  entry !== undefined && path.resolve(entry) === path.resolve(thisFile);

if (isDirectRun) {
  runSeed().catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  });
}
