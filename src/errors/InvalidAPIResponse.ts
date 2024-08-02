import { InipError, InipErrorCodes } from './InipError';

export class InvalidAPIResponseError extends InipError {
	public static readonly code = InipErrorCodes.ERR_InvalidAPIResponse;
}
