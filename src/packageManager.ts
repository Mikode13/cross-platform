import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const javascriptExtensions = new Set(['.js', '.cjs', '.mjs']);

export interface RunPackageManagerOptions {
	cwd?: string;
}

export interface PackageManagerOutput {
	stdout: string;
	stderr: string;
}

export async function runPackageManager(
	args: readonly string[],
	options?: RunPackageManagerOptions,
): Promise<PackageManagerOutput> {
	const npmExecPath = process.env.npm_execpath;

	if (!npmExecPath) {
		throw new Error('The script must be run through a package manager');
	}

	const isJavaScript = javascriptExtensions.has(path.extname(npmExecPath).toLowerCase());

	const executable = isJavaScript ? process.execPath : npmExecPath;
	const executableArgs = isJavaScript ? [npmExecPath, ...args] : [...args];

	const { stdout, stderr } = await execFileAsync(executable, executableArgs, {
		cwd: options?.cwd,
		encoding: 'utf8',
	});

	return { stdout, stderr };
}
