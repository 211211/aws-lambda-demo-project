import 'source-map-support/register';

import { getAllRecords } from '../../../src/communication/DB/genericDbQueries';
import { tablePhotoAssignments } from '../../../src/communication/DB/ktAssignmentRepo';
import { PhotoStudioAssignments } from '../../../src/tables/workbench/assignments';
import { apiTimeout } from '../../utils/helpers';

describe('Test connect to local dynamoDB', () => {
	it(
		'it should work',
		async () => {
			const photoAssignments = await getAllRecords(tablePhotoAssignments, PhotoStudioAssignments);
			expect(photoAssignments.length).toEqual(117);
		},
		apiTimeout,
	);
});
