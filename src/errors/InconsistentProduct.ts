import { InipError, InipErrorCodes } from './InipError';

export class InconsistentProductError extends InipError {
	public static readonly code = InipErrorCodes.ERR_InconsistentProduct;
}
