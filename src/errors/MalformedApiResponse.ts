import { InipErrorCodes } from './InipError';
import { MalformedThingError } from './MalformedThing';

/**
 * Indicates that we got a response from the API, but the format was not expected.
 */
export class MalformedApiResponseError extends MalformedThingError {
	public static readonly code = InipErrorCodes.ERR_MalformedAPIResponse;
}
