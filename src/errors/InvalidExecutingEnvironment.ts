import { InipError, InipErrorCodes } from './InipError';

export class InvalidExecutingEnvironmentError extends InipError {
	public static readonly code = InipErrorCodes.ERR_InvalidExecutingEnvironment;
}
