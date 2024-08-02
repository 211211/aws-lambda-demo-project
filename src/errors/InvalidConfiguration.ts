import { InipError, InipErrorCodes } from './InipError';

/**
 * This Error is used for an invalid configuration of the Lambda.
 *
 * For example there is an invalid or missing environment variable.
 */
export class InvalidConfigurationError extends InipError {
	public static readonly code = InipErrorCodes.ERR_InvalidMessage;
}
