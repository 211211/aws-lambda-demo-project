module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	modulePathIgnorePatterns: [
		'<rootDir>/.aws-sam',
		'<rootDir>/__tests__/fixtures',
		'<rootDir>/__tests__/utils',
		'<rootDir>/__tests__/global-setup.js',
	],
	clearMocks: true,
	collectCoverage: true,
	coverageDirectory: 'test-results',
	coverageProvider: 'v8',
	globals: {
		'ts-jest': {
			isolatedModules: true,
		},
	},
	testPathIgnorePatterns: ['data'],
};
