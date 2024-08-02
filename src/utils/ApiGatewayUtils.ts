import { APIGatewayProxyResult } from 'aws-lambda/trigger/api-gateway-proxy';

import { ValidationError } from '../errors';
import { InipError } from '../errors/InipError';
import { MalformedThingError } from '../errors/MalformedThing';

export function returnResult(
	statusCode: number,
	message: string,
	headers?: Record<string, string>,
	isBase64Encoded?: boolean,
): APIGatewayProxyResult {
	return returnCustomResult(
		statusCode,
		{
			message: message,
		},
		headers,
		isBase64Encoded,
	);
}

export function returnCustomResult(
	statusCode: number,
	body: unknown,
	headers?: Record<string, string>,
	isBase64Encoded?: boolean,
): APIGatewayProxyResult {
	const response: APIGatewayProxyResult = {
		statusCode: statusCode,
		body: JSON.stringify(body),
		isBase64Encoded: isBase64Encoded,
	};
	if (headers != null) response.headers = headers;
	return response;
}

export function outputError(e: unknown, headers?: Record<string, string>): APIGatewayProxyResult {
	if (e instanceof MalformedThingError || e instanceof ValidationError) {
		return returnCustomResult(
			e.statusCode,
			{
				message: e.message,
				errors: e.humanReadableErrors,
			},
			headers,
		);
	}
	if (e instanceof InipError) {
		return returnResult(e.statusCode, e.message, headers);
	}
	if (e instanceof Error) {
		return returnResult(500, e.message, headers);
	}
	return returnResult(500, 'Internal Server Error', headers);
}
