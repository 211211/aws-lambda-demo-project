import * as t from 'io-ts';

import { GeneralSizeMappingError } from './GeneralSizeMapping';
import { InipErrorCodes } from './InipError';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const SizeMappingMissingErrorC = t.type({
	name: t.literal('SizeMappingMissingError'),

	kt: t.number,
	brand: t.string,
	targetGroup: t.union([t.string, t.undefined]),
	sizesInProduct: t.array(t.string),
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type SizeMappingMissingErrorC = t.TypeOf<typeof SizeMappingMissingErrorC>;

export class SizeMappingMissingError extends GeneralSizeMappingError implements SizeMappingMissingErrorC {
	public static readonly code = InipErrorCodes.ERR_SizemappingMissing;

	public name = 'SizeMappingMissingError' as const;

	/**
	 * Describes an Error to indicate some SizeMapping is missing for a given KT-Brand combination
	 *
	 * @param message Error Message
	 * @param kt ConsumptionTheme
	 */
	public constructor(
		message: string,
		public kt: number,
		public brand: string,
		public targetGroup: string | undefined = undefined,
		public sizesInProduct: string[] = [],
	) {
		super(message, 500);
	}
}
