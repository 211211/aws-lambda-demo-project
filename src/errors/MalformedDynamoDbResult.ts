import { InipErrorCodes } from './InipError';
import { MalformedThingError } from './MalformedThing';

/**
 * Indicates we got Data from the DynamoDB, but the format was not expected.
 */
export class MalformedDynamoDbResultError extends MalformedThingError {
	public static readonly code = InipErrorCodes.ERR_InvalidDynamoDbResult;
}
