import * as t from 'io-ts';

import { GeneralSizeMappingError } from './GeneralSizeMapping';
import { InipErrorCodes } from './InipError';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const NoSizeMappingIntersectionErrorC = t.type({
	name: t.literal('NoSizeMappingIntersectionError'),
	kt: t.number,
	brand: t.string,
	targetGroup: t.union([t.string, t.undefined]),
	sizesInProduct: t.array(t.string),
	sizesMapping: t.array(t.string),
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type NoSizeMappingIntersectionErrorC = t.TypeOf<typeof NoSizeMappingIntersectionErrorC>;

export class NoSizeMappingIntersectionError extends GeneralSizeMappingError implements NoSizeMappingIntersectionErrorC {
	public static readonly code = InipErrorCodes.ERR_NoSizeMappingIntersection;

	public name = 'NoSizeMappingIntersectionError' as const;

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
		public sizesMapping: string[] = [],
	) {
		super(message, 500);
	}
}
