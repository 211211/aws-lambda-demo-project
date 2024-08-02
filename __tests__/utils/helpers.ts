import { hasOwnProperty } from '../../src/utils/ts';
// import { APIGatewayProxyEvent } from 'aws-lambda';

export function loadJestEnv(): void {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	require('dotenv').config({ path: './.env.jest' });
}

/**
 * The timeout to be used for functions which do API-Calls
 */
export const apiTimeout = 30_000; // 30 seconds

// export function constructAPIGwEvent(message: any, options: Record<string, any> = {}): APIGatewayProxyEvent {
// 	return {
// 		httpMethod: options.method || 'GET',
// 		path: options.path || '/',
// 		queryStringParameters: options.query || {},
// 		headers: options.headers || {},
// 		body: options.rawBody || JSON.stringify(message),
// 		multiValueHeaders: {},
// 		multiValueQueryStringParameters: {},
// 		isBase64Encoded: false,
// 		pathParameters: options.pathParameters || {},
// 		stageVariables: options.stageVariables || {},
// 		requestContext: options.requestContext || {},
// 		resource: options.resource || '',
// 	};
// }

/**
 * Get the array value of a property from an object
 *
 * @returns any[] if target array is available
 * @returns undefined if target array isn't available or not an array
 */
export function getPropArrayValue<T>(obj: T, prop: string): any[] | undefined {
	if (typeof obj === 'object' && obj != null && hasOwnProperty(obj, prop) && Array.isArray(obj[prop])) {
		// obj[prop] will be any[] in here => disable no-unsafe-return
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return obj[prop] as any[];
	}
	return undefined;
}

export async function wait(ms: number): Promise<void> {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
}
