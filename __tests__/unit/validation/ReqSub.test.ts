import 'source-map-support/register';

/* eslint-disable import/order */
import { loadJestEnv } from '../../utils/helpers';
loadJestEnv();

import { Context, ScheduledEvent } from 'aws-lambda';
import { reqSubHandler } from '../../../src/handlers/ReqSub';
import { getApiEndpoint } from '../../../src/utils/network';
const api = getApiEndpoint();

// The API will be call by an axiosInstance => we have to use jest.spyOn and mockImplementation() to mock the response
// https://stackoverflow.com/a/64267708
const mockApiInstance = jest.spyOn(api, 'post');

describe('Test the reqSubHandler function', () => {
	const event: ScheduledEvent = {
		id: '',
		version: '',
		account: '',
		time: '',
		region: '',
		resources: [],
		source: '',
		'detail-type': 'Scheduled Event',
		detail: null,
	};

	const context: Context = {
		awsRequestId: '',
		functionName: '',
		functionVersion: '',
		invokedFunctionArn: '',
		memoryLimitInMB: '',
		logGroupName: '',
		logStreamName: '',
		callbackWaitsForEmptyEventLoop: false,

		getRemainingTimeInMillis: () => 0,
		done: () => void {},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		fail: (error: Error | string) => void {},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		succeed: (messageOrObject: any) => void {},
		// succeed: (message: string, object: any) => void {}
	};

	it('A "success" message should be returned for a successful API POST request', async () => {
		const resp = { status: 200 };
		mockApiInstance.mockImplementation(async () => Promise.resolve(resp));

		const successMessage = {
			statusCode: 200,
			body: JSON.stringify({
				message: 'success',
			}),
			isBase64Encoded: undefined,
		};
		const result = await reqSubHandler(event, context);
		expect(result).toStrictEqual(successMessage);
	});

	it('An "error" message should be returned for a failed API POST request', async () => {
		const resp = { status: 401 };
		mockApiInstance.mockImplementation(async () => Promise.resolve(resp));

		const errorMessage = {
			statusCode: 500,
			body: JSON.stringify({
				message: 'Error',
			}),
			isBase64Encoded: undefined,
		};
		const result = await reqSubHandler(event, context);
		expect(result).toStrictEqual(errorMessage);
	});
});
