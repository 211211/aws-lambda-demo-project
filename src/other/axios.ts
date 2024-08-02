import axios, { AxiosStatic, AxiosInstance } from 'axios';

import { hasOwnProperty } from '../utils/ts';

export function enableAxiosTiming(instance: AxiosInstance | AxiosStatic = axios, thresholdMs = 0): void {
	instance.interceptors.request.use(
		function (config) {
			if (!hasOwnProperty(config, 'meta')) {
				/// @ts-expect-error workaround
				config.meta = {};
			}
			/// @ts-expect-error workaround
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			config.meta.requestStartedAt = new Date();
			return config;
		},
		async function (error) {
			return Promise.reject(error);
		},
	);

	instance.interceptors.response.use(
		(x) => {
			/// @ts-expect-error meh, this should work.
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			const timeMs = new Date().getTime() - x.config.meta.requestStartedAt;
			if (timeMs >= thresholdMs) console.log(`Execution time for: ${x.config.url} - ${timeMs} ms`);
			return x;
		},
		// Handle 4xx & 5xx responses
		(x) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			const timeMs = new Date().getTime() - x.config.meta.requestStartedAt;
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
			if (timeMs >= thresholdMs) console.log(`Execution time for: ${x.config.url} - ${timeMs} ms`);
			throw x;
		},
	);
}
