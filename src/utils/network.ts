import axios, { AxiosInstance } from 'axios';
/// @ts-expect-error // types are not avaiable
import { ConcurrencyManager } from 'axios-concurrency';

import { config } from '../config';

let api: AxiosInstance | undefined;
export function getApiEndpoint(): AxiosInstance {
	if (api != null) return api;

	api = axios.create({
		baseURL: config.endpoints.productlake,
		headers: {
			Authorization: 'Basic bWtpOm1raQ==',
		},
		timeout: config.axios.defaultTimeout,
	});

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
	ConcurrencyManager(api, config.axios.maxConcurent);

	return api;
}
