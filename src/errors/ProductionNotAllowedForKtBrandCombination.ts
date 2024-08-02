import * as t from 'io-ts';

import { GeneralSizeMappingError } from './GeneralSizeMapping';
import { InipErrorCodes } from './InipError';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ProductionNotAllowedForKtBrandCombinationC = t.type({
	name: t.literal('ProductionNotAllowedForKtBrandCombination'),

	kt: t.number,
	brand: t.string,
	targetGroup: t.union([t.string, t.undefined]),
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ProductionNotAllowedForKtBrandCombinationC = t.TypeOf<typeof ProductionNotAllowedForKtBrandCombinationC>;

export class ProductionNotAllowedForKtBrandCombinationError extends GeneralSizeMappingError implements ProductionNotAllowedForKtBrandCombinationC {
	public static readonly code = InipErrorCodes.ERR_SizemappingKtBrandNotAllowed;
	public name = 'ProductionNotAllowedForKtBrandCombination' as const;

	/**
	 * Describes an Error to indicate the Production is not allowed for a ConsumptionTheme / Brand combination.
	 *
	 * @param message Error Message
	 * @param kt ConsumptionTheme
	 */
	public constructor(public kt: number, public brand: string, public targetGroup: string | undefined = undefined, message?: string) {
		super(
			`Production is not allowed for ConsumptionTheme ${kt}, brand ${brand}${targetGroup != null ? `, TargetGroup ${targetGroup}` : ''}.${
				message != null ? ` ${message}` : ''
			}`,
			500,
		);
	}
}
