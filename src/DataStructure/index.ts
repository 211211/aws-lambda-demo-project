/*
 * This file is used to define a common Data-Structure for the Step-Functions.
 */
/* eslint-disable @typescript-eslint/naming-convention */

import * as t from 'io-ts';

import { AssignmentData } from './assignment';
import { optional } from 'io-ts-extra';

export * from './assignment';

export const TransferStructure = t.type({

	assignmentData: optional(AssignmentData),
	// and others ...

	error: optional(t.unknown),
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type TransferStructure = t.TypeOf<typeof TransferStructure>;

export const defaultTransferStructure: TransferStructure = {
	assignmentData: undefined,
	error: undefined,
};
