// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
global.Promise = require('bluebird');
/// @ts-expect-error // these are Bluebird promises
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
Promise.config({
	// Enable warnings
	warnings: true,
	// Enable long stack traces
	longStackTraces: true,
	// Enable cancellation
	cancellation: true,
	// Enable monitoring
	monitoring: true,
	// Enable async hooks
	asyncHooks: true,
});

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
	// eslint-disable-next-line no-debugger
	debugger;
});
