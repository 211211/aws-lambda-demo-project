import * as t from 'io-ts';

import { GeneralSizeMappingError } from './GeneralSizeMapping';
import { InipErrorCodes } from './InipError';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const PhotoStudioAssignmentMissingErrorC = t.type({
	name: t.literal('PhotoStudioAssignmentMissingError'),

	kt: t.number,
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type PhotoStudioAssignmentMissingErrorC = t.TypeOf<typeof PhotoStudioAssignmentMissingErrorC>;

export class PhotoStudioAssignmentMissingError extends GeneralSizeMappingError implements PhotoStudioAssignmentMissingErrorC {
	public static readonly code = InipErrorCodes.ERR_PhotoStudioAssignmentMissing;
	public name = 'PhotoStudioAssignmentMissingError' as const;

	/**
	 * Describes an Error to indicate some PhotoStudioAssignment is missing for a given KT
	 *
	 * @param message Error Message
	 * @param kt ConsumptionTheme
	 */
	public constructor(message: string, public kt: number) {
		super(message, 500);
	}
}
