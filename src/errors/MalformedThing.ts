import { Validation } from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';

import { InipError } from './InipError';

export class MalformedThingError extends InipError {
	public humanReadableErrors: string[];

	public constructor(message: string, errors: Validation<any>, statusCode?: number) {
		super(message, statusCode);

		this.humanReadableErrors = PathReporter.report(errors).slice(0, 10);
	}
}
