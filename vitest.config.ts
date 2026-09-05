import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// No behavior exists yet to test; remove once the first *.unit.test.ts lands.
		passWithNoTests: true,
		projects: [
			{
				test: {
					name: 'unit',
					include: ['tests/unit/**/*.unit.test.ts'],
				},
			},
		],
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
		},
	},
});
