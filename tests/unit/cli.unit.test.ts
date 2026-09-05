import { mkdir, mkdtemp, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clean } from '../../src/clean.ts';
import { resolveCleanTarget, runCli } from '../../src/cli.ts';

let workspace: string;

beforeEach(async () => {
	workspace = await mkdtemp(path.join(tmpdir(), 'cross-platform-cli-'));
});

afterEach(async () => {
	await clean(workspace);
});

describe('resolveCleanTarget', () => {
	it('resolves a relative path against the given cwd', () => {
		expect(resolveCleanTarget('dist', workspace)).toBe(path.join(workspace, 'dist'));
	});

	it('allows a target outside the cwd', () => {
		const outside = path.join(workspace, '..', 'other-dir');

		expect(resolveCleanTarget('../other-dir', workspace)).toBe(path.resolve(outside));
	});

	it('rejects an empty path', () => {
		expect(() => resolveCleanTarget('', workspace)).toThrow('A path is required');
	});

	it('rejects a whitespace-only path', () => {
		expect(() => resolveCleanTarget('   ', workspace)).toThrow('A path is required');
	});

	it('rejects the filesystem root', () => {
		const root = path.parse(workspace).root;

		expect(() => resolveCleanTarget(root, workspace)).toThrow('Cannot clean a filesystem root');
	});

	it('rejects the current working directory', () => {
		expect(() => resolveCleanTarget('.', workspace)).toThrow(
			'Cannot clean the current working directory',
		);
	});
});

describe('runCli', () => {
	it('rejects an unrecognized command', async () => {
		await expect(runCli(['build', 'dist'], workspace)).rejects.toThrow(
			'Unrecognized command: "build". The only supported command is "clean".',
		);
	});

	it('rejects a missing command', async () => {
		await expect(runCli([], workspace)).rejects.toThrow(
			'Unrecognized command: "". The only supported command is "clean".',
		);
	});

	it('propagates target validation errors for the clean command', async () => {
		await expect(runCli(['clean', '.'], workspace)).rejects.toThrow(
			'Cannot clean the current working directory',
		);
	});

	it('cleans the resolved target for the clean command', async () => {
		const target = path.join(workspace, 'dist');
		await mkdir(target, { recursive: true });
		await writeFile(path.join(target, 'output.js'), 'console.log(1);');

		await runCli(['clean', 'dist'], workspace);

		await expect(stat(target)).rejects.toMatchObject({ code: 'ENOENT' });
	});
});
