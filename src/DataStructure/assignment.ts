import * as t from 'io-ts';
import { optional } from 'io-ts-extra';

import { ParsedPhotostudioAssignmentItem } from '../communication/DB/ktAssignmentRepo';
import {
	BrandMissingErrorC,
	PhotoStudioAssignmentMissingErrorC,
	ProductionNotAllowedForKtBrandCombinationC,
	ProductionNotAllowedForKtC,
	SectorMissingErrorC,
	SizeMappingMissingErrorC,
} from '../errors';
import { NoSizeMappingIntersectionErrorC } from '../errors/NoSizeMappingIntersection';
import { PhotoStudioAssignments, SizeMapping, SizeMappingSelector } from '../tables/workbench/assignments';
import { GroupedProduct } from './Product';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const AssignmentDataSuccess = t.type({
	/**
	 * Selector which was used to query the information
	 */
	selector: SizeMappingSelector,
	photoAssignment: PhotoStudioAssignments,
	sizeMapping: SizeMapping,
	currentPhotoStudioAssignment: ParsedPhotostudioAssignmentItem,
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AssignmentDataSuccess = t.TypeOf<typeof AssignmentDataSuccess>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export const AssignmentDataFailure = t.intersection([
	t.type({
		isError: t.literal(true),
		product: optional(GroupedProduct),
	}),
	t.union([
		PhotoStudioAssignmentMissingErrorC,
		SizeMappingMissingErrorC,
		NoSizeMappingIntersectionErrorC,
		ProductionNotAllowedForKtC,
		ProductionNotAllowedForKtBrandCombinationC,
		BrandMissingErrorC,
		SectorMissingErrorC,
	]),
]);
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AssignmentDataFailure = t.TypeOf<typeof AssignmentDataFailure>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export const AssignmentData = t.union([AssignmentDataSuccess, AssignmentDataFailure]);
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AssignmentData = t.TypeOf<typeof AssignmentData>;
