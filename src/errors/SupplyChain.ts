import { InipError } from './InipError';

/**
 * Indicates that we got an Article with an invalid supplyChain
 */
export class SupplyChainError extends InipError {
	public constructor(message: string, statusCode = 400) {
		super(message, statusCode);
	}
}
