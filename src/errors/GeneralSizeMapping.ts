import { InipError } from './InipError';

export abstract class GeneralSizeMappingError extends InipError {
	public constructor(message: string, statusCode = 500) {
		super(message, statusCode);
	}
}
