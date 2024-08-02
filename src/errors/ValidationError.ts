import { InipError, InipErrorCodes } from './InipError';

export class ValidationError extends InipError {
	public static readonly code = InipErrorCodes.ERR_ValidationError;
	public humanReadableErrors: string[];

	public constructor(message: string, errors: string[], statusCode = 400) {
		super(message, statusCode);

		this.humanReadableErrors = errors;
	}
}
