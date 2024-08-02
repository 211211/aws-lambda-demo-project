export function createTimeProxy<T extends (...args: any[]) => Promise<any>>(fn: T, minTimeToLogMs = 1000, hint?: unknown): T {
	const handlerAsyncTiming = {
		// eslint-disable-next-line @typescript-eslint/ban-types
		apply: async function (target: T, thisArg: unknown, args: Parameters<T>) {
			const hrstart = process.hrtime();
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const result = target.apply(thisArg, args);
			if ((result as any) instanceof Promise) {
				await Promise.allSettled([result as any]);
			}
			const hrend = process.hrtime(hrstart);

			const ms = hrend[0] * 1000 + hrend[1] / 1_000_000;
			if (ms > minTimeToLogMs) {
				console.info('Execution time(hr): %ds %dms', hrend[0], ms, hint ?? target);
			}
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return result;
		},
	};
	// eslint-disable-next-line no-undef
	return new Proxy(fn, handlerAsyncTiming) as unknown as T;
}
