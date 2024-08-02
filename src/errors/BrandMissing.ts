import * as t from 'io-ts';

import { GeneralSizeMappingError } from './GeneralSizeMapping';
import { InipErrorCodes } from './InipError';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const BrandMissingErrorC = t.type({
	name: t.literal('BrandMissingError'),
	brand: t.string,
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type BrandMissingErrorC = t.TypeOf<typeof BrandMissingErrorC>;

export class BrandMissingError extends GeneralSizeMappingError implements BrandMissingErrorC {
	public static readonly code = InipErrorCodes.ERR_MissingBrand;

	public name = 'BrandMissingError' as const;

	/**
	 * Describes an Error to indicate an unknown brand id to the system
	 *
	 * @param message Error Message
	 * @param brand ConsumptionTheme
	 */
	public constructor(message: string, public brand: string) {
		super(message, 500);
	}
}
