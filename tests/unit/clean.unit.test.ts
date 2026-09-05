import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clean } from '../../src/clean.ts';

let workspace: string;

beforeEach(async () => {
	workspace = await mkdtemp(path.join(tmpdir(), 'cross-platform-clean-'));
});

afterEach(async () => {
	await clean(workspace);
});

describe('clean', () => {
	it('removes a directory and its contents', async () => {
		const target = path.join(workspace, 'dist');
		await mkdir(path.join(target, 'nested'), { recursive: true });
		await writeFile(path.join(target, 'nested', 'output.js'), 'console.log(1);');

		await clean(target);

		await expect(stat(target)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('does not throw when the target does not exist', async () => {
		const target = path.join(workspace, 'already-gone');

		await expect(clean(target)).resolves.toBeUndefined();
	});

	it('leaves sibling paths untouched', async () => {
		const target = path.join(workspace, 'dist');
		const sibling = path.join(workspace, 'keep-me.txt');
		await mkdir(target, { recursive: true });
		await writeFile(sibling, 'keep');

		await clean(target);

		await expect(readFile(sibling, 'utf8')).resolves.toBe('keep');
	});
});
