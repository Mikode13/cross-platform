import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clean } from '../../src/clean.ts';
import { runPackageManager } from '../../src/packageManager.ts';

let workspace: string;

beforeEach(async () => {
	workspace = await mkdtemp(path.join(tmpdir(), 'cross-platform-package-manager-'));
});

afterEach(async () => {
	vi.unstubAllEnvs();
	await clean(workspace);
});

describe('runPackageManager', () => {
	it('rejects when the script was not invoked through a package manager', async () => {
		vi.stubEnv('npm_execpath', '');

		await expect(runPackageManager(['--version'])).rejects.toThrow(
			'The script must be run through a package manager',
		);
	});

	it.each(['js', 'cjs', 'mjs'])(
		'runs a .%s package manager entry point through Node',
		async extension => {
			const entryPoint = path.join(workspace, `package-manager.${extension}`);
			await writeFile(
				entryPoint,
				'process.stdout.write(JSON.stringify({ ' +
					'args: process.argv.slice(2), ' +
					'cwdName: process.cwd().split(/[\\\\/]/).at(-1) }));\n',
			);
			vi.stubEnv('npm_execpath', entryPoint);

			const { stdout, stderr } = await runPackageManager(['pack', '--dry-run'], {
				cwd: workspace,
			});

			expect(stderr).toBe('');
			// Windows can report parent directories through 8.3 aliases for the same path.
			expect(JSON.parse(stdout)).toEqual({
				args: ['pack', '--dry-run'],
				cwdName: path.basename(workspace),
			});
		},
	);

	it('runs a native package manager entry point directly', async () => {
		vi.stubEnv('npm_execpath', process.execPath);

		const { stdout, stderr } = await runPackageManager([
			'-e',
			"process.stdout.write('native entry point')",
		]);

		expect(stdout).toBe('native entry point');
		expect(stderr).toBe('');
	});

	it('uses the current working directory by default', async () => {
		vi.stubEnv('npm_execpath', process.execPath);

		const { stdout } = await runPackageManager(['-e', 'process.stdout.write(process.cwd())']);

		expect(stdout).toBe(process.cwd());
	});

	it('preserves package manager output when the command fails', async () => {
		vi.stubEnv('npm_execpath', process.execPath);

		await expect(
			runPackageManager([
				'-e',
				"process.stdout.write('captured output'); " +
					"process.stderr.write('captured error'); process.exitCode = 7;",
			]),
		).rejects.toMatchObject({
			code: 7,
			stdout: 'captured output',
			stderr: 'captured error',
		});
	});
});
