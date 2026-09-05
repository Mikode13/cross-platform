import { clean } from './clean.ts';
import path from 'node:path';

const [, , command, target] = process.argv;

if (!target?.trim()) {
	throw new Error('A path is required');
}

const resolved = path.resolve(target);
const root = path.parse(resolved).root;

if (resolved === root) {
	throw new Error('Cannot clean a filesystem root');
}

const cwd = process.cwd();
if (resolved === cwd) {
	throw new Error('Cannot clean the current working directory');
}

if (command === 'clean') {
	await clean(target);
}
