import 'source-map-support/register';

import { APIGatewayProxyResult, Context, ScheduledEvent } from 'aws-lambda';
import * as AWS from 'aws-sdk';

// Why do i need to set the Region?
AWS.config.update({ region: 'eu-central-1' });

import { InvalidAPIResponseError } from '../errors/InvalidAPIResponse';
import { InvalidConfigurationError } from '../errors/InvalidConfiguration';
import { getApiEndpoint } from '../utils/network';
import { isValidUrl } from '../utils/url';
import { returnResult } from '../utils/ApiGatewayUtils';
import { config } from '../config';

const api = getApiEndpoint();

/**
 * A simple example includes a HTTP get method.
 */
export const reqSubHandler = async (event: ScheduledEvent, context: Context): Promise<APIGatewayProxyResult> => {
	// All log statements are written to CloudWatch
	console.debug('Received event: ', event);
	console.debug('Received context: ', context);

	if (!isValidUrl(config.self.endpoints.notification)) {
		throw new InvalidConfigurationError(
			`Invalid notification endpoint: ${config.self.endpoints.notification}, Please set NOTIFICATION_ENDPOINT env var to a valid URL.`,
		);
	}
	const notificationEndpoint = `${config.self.endpoints.notification}/postmessage`;
	try {
		const result = await api.post('/notification/subscribe', {
			protocol: 'https',
			topicName: 'notification-article',
			url: notificationEndpoint,
		});

		if (result.status !== 200)
			throw new InvalidAPIResponseError(`Invalid response from /notification/subscribe call, expected 200, got ${result.status}`);
	} catch (err) {
		console.error('Error calling /notification/subscribe', err);
		return returnResult(500, 'Error');
	}

	return returnResult(200, 'success');
};
