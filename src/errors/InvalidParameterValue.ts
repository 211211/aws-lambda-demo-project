import { InipError, InipErrorCodes } from './InipError';

export class InvalidParameterValueError extends InipError {
	public static readonly code = InipErrorCodes.ERR_InvalidParameterValue;
}
