import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clean } from './clean.ts';

export function resolveCleanTarget(target: string, cwd: string): string {
	if (!target.trim()) {
		throw new Error('A path is required');
	}

	const resolved = path.resolve(cwd, target);

	if (resolved === path.parse(resolved).root) {
		throw new Error('Cannot clean a filesystem root');
	}

	if (resolved === path.resolve(cwd)) {
		throw new Error('Cannot clean the current working directory');
	}

	return resolved;
}

export async function runCli(argv: string[], cwd: string): Promise<void> {
	const [command, target] = argv;

	if (command !== 'clean') {
		throw new Error(
			`Unrecognized command: "${command ?? ''}". The only supported command is "clean".`,
		);
	}

	const resolved = resolveCleanTarget(target ?? '', cwd);
	await clean(resolved);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await runCli(process.argv.slice(2), process.cwd());
}
