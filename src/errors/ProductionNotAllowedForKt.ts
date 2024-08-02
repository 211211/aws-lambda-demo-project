import * as t from 'io-ts';

import { GeneralSizeMappingError } from './GeneralSizeMapping';
import { InipErrorCodes } from './InipError';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ProductionNotAllowedForKtC = t.type({
	name: t.literal('ProductionNotAllowedForKt'),

	kt: t.number,
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ProductionNotAllowedForKtC = t.TypeOf<typeof ProductionNotAllowedForKtC>;

export class ProductionNotAllowedForKtError extends GeneralSizeMappingError implements ProductionNotAllowedForKtC {
	public static readonly code = InipErrorCodes.ERR_SizeMappingKtNotAllowed;
	public name = 'ProductionNotAllowedForKt' as const;

	/**
	 * Describes an Error to indicate the Production is not allowed for a ConsumptionTheme
	 *
	 * @param message Error Message
	 * @param kt ConsumptionTheme
	 */
	public constructor(public kt: number, message?: string, statusCode = 500) {
		super(`Production is not allowed for ConsumptionTheme ${kt}.${message != null ? ` ${message}` : ''}`, statusCode);
	}
}
