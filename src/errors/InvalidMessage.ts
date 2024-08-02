import { InipError, InipErrorCodes } from './InipError';

export class InvalidMessageError extends InipError {
	public static readonly code = InipErrorCodes.ERR_InvalidMessage;
}
