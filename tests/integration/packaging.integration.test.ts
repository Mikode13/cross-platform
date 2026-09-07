import { execFile } from 'node:child_process';
import { readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const distribution = path.join(repositoryRoot, 'dist');

/** `execFile` rejects with the captured streams attached to the error. */
function outputOf(error: unknown): { stdout: string; stderr: string } {
	const { stdout, stderr } = error as { stdout?: string; stderr?: string };
	return { stdout: stdout ?? '', stderr: stderr ?? '' };
}

async function build(): Promise<void> {
	await execFileAsync('pnpm', ['run', 'build'], { cwd: repositoryRoot });
}

/**
 * Runs the verifier alone. `pnpm run pack:check` builds first, which would erase any
 * fault injected into `dist`, so these tests invoke the script directly.
 */
async function verify(): Promise<{ ok: boolean; stdout: string; stderr: string }> {
	try {
		const { stdout } = await execFileAsync('node', ['scripts/pack-check.mjs'], {
			cwd: repositoryRoot,
		});
		return { ok: true, stdout, stderr: '' };
	} catch (error) {
		return { ok: false, ...outputOf(error) };
	}
}

/**
 * Derived independently of `scripts/pack-check.mjs`, so a verifier that silently expects
 * the wrong set fails here instead of agreeing with itself. Four emitted artifacts per
 * source (`.js`, `.js.map`, `.d.ts`, `.d.ts.map`) plus LICENSE, package.json, and
 * README.md, which npm always includes. That is 19 files today.
 */
async function expectedFileCount(): Promise<number> {
	const entries = await readdir(path.join(repositoryRoot, 'src'), { recursive: true });
	return entries.filter(entry => entry.endsWith('.ts')).length * 4 + 3;
}

beforeAll(build);

// Leave the working tree with output matching the current sources, however a test ended.
afterAll(build);

describe('build', () => {
	it('removes output whose source file no longer exists', async () => {
		// Reproduces the defect: `src/cliClean.ts` was renamed to `src/cli.ts`, but `tsc`
		// never empties `outDir`, so the old emit survived every later build and was
		// published in 0.1.0.
		const orphan = path.join(distribution, 'cliClean.js');
		await writeFile(orphan, '// emit of a source file that was renamed away\n');

		await build();

		await expect(stat(orphan)).rejects.toMatchObject({ code: 'ENOENT' });
		await expect(stat(path.join(distribution, 'index.js'))).resolves.toBeDefined();
	});
});

describe('pack:check', () => {
	it('accepts a freshly built tarball containing exactly the expected files', async () => {
		const result = await verify();

		expect(result.stderr).toBe('');
		expect(result.ok).toBe(true);
		const expected = String(await expectedFileCount());
		expect(result.stdout).toContain(`exactly the ${expected} expected files`);
	});

	it('rejects a tarball that is missing a declared entry point', async () => {
		await rm(path.join(distribution, 'index.js'));

		const result = await verify();

		expect(result.ok).toBe(false);
		expect(result.stderr).toContain('Missing from the tarball');
		expect(result.stderr).toContain('dist/index.js');
		// The manifest promises this path to consumers, so it is reported twice over.
		expect(result.stderr).toContain('main -> ./dist/index.js');
		expect(result.stderr).toContain('exports["."] -> ./dist/index.js');
	});

	it('rejects a tarball containing an unexpected file', async () => {
		await writeFile(path.join(distribution, 'cliClean.js'), '// stale emit\n');

		const result = await verify();

		expect(result.ok).toBe(false);
		expect(result.stderr).toContain('Unexpected in the tarball');
		expect(result.stderr).toContain('dist/cliClean.js');
	});

	it('rejects a tarball with no build output at all', async () => {
		// What CI silently accepted: the shared `pack` job installs but never builds, so
		// the old `pnpm pack --dry-run` packed LICENSE, package.json, and README.md alone
		// and exited zero.
		await rm(distribution, { recursive: true, force: true });

		const result = await verify();

		expect(result.ok).toBe(false);
		expect(result.stderr).toContain('Missing from the tarball');
		expect(result.stderr).toContain('dist/index.js');
		expect(result.stderr).toContain('dist/bin.js');
	});
});
