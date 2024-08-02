import { InipError, InipErrorCodes } from './InipError';

export class InvalidDynamoDbResultError extends InipError {
	public static readonly code = InipErrorCodes.ERR_InvalidDynamoDbResult;
}
