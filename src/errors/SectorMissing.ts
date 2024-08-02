import * as t from 'io-ts';

import { GeneralSizeMappingError } from './GeneralSizeMapping';
import { InipErrorCodes } from './InipError';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const SectorMissingErrorC = t.type({
	name: t.literal('SectorMissingError'),
	sector: t.number,
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type SectorMissingErrorC = t.TypeOf<typeof SectorMissingErrorC>;

export class SectorMissingError extends GeneralSizeMappingError implements SectorMissingErrorC {
	public static readonly code = InipErrorCodes.ERR_MissingSector;

	public name = 'SectorMissingError' as const;

	/**
	 * Describes an Error to indicate an unknown brand id to the system
	 *
	 * @param message Error Message
	 * @param sector Sector Id
	 */
	public constructor(message: string, public sector: number) {
		super(message, 500);
	}
}
