import { Validation } from 'io-ts';

import { InipErrorCodes } from './InipError';
import { MalformedThingError } from './MalformedThing';

/**
 * Indicates that we got a response from the API, but the format was not expected.
 */
export class MalformedInputError extends MalformedThingError {
	public static readonly code = InipErrorCodes.ERR_MalformedInput;

	public constructor(message: string, errors: Validation<any>, statusCode = 400) {
		super(message, errors, statusCode);
	}
}
