import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runPackageManager } from '../../src/packageManager.ts';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));

describe('runPackageManager', () => {
	it('runs the real package manager that invoked the test suite', async () => {
		const manifest = JSON.parse(
			await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'),
		) as { packageManager: string };
		const expectedVersion = manifest.packageManager.slice(
			manifest.packageManager.lastIndexOf('@') + 1,
		);

		const { stdout, stderr } = await runPackageManager(['--version'], {
			cwd: repositoryRoot,
		});

		expect(stderr).toBe('');
		expect(stdout.trim()).toBe(expectedVersion);
	});
});
