import { describe, expect, it } from 'vitest';
import { runPackageManager } from '../../src/packageManager.ts';

function packageManagerVersionFromUserAgent(userAgent: string | undefined): string {
	const version = userAgent?.match(/^[^/\s]+\/(\S+)/u)?.[1];

	if (!version) {
		throw new Error('The package manager user agent does not contain a version');
	}

	return version;
}

describe('runPackageManager', () => {
	it('runs the real package manager that invoked the test suite', async () => {
		const expectedVersion = packageManagerVersionFromUserAgent(process.env.npm_config_user_agent);

		const { stdout, stderr } = await runPackageManager(['--version']);

		expect(stderr).toBe('');
		expect(stdout.trim()).toBe(expectedVersion);
	});
});
