import { InipError, InipErrorCodes } from './InipError';

export class OutdatedWaitingTaskToken extends InipError {
	public static readonly code = InipErrorCodes.ERR_OutdatedWaitingTaskToken;
}
