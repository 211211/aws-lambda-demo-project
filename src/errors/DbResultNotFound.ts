import { InipError, InipErrorCodes } from './InipError';

export class DbResultNotFoundError extends InipError {
	public static readonly code = InipErrorCodes.ERR_DbResultNotFound;

	public constructor(message: string, statusCode = 404) {
		super(message, statusCode);
	}
}
