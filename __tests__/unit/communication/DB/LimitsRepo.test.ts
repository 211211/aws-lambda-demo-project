import 'source-map-support/register';

import * as t from 'io-ts';

import { putBatchItemsToTable } from '../../../../src/communication/DB/genericDbQueries';
import { Limit, tableLimits, updateLimitCounterByDate } from '../../../../src/communication/DB/LimitsRepo';
import { dateYearMonthDayBrand } from '../../../../src/validation/Date';
import { apiTimeout } from '../../../utils/helpers';

describe('Test the LimitsRepo functions', () => {
	it(
		'Should return false for an unvailable day',
		async () => {
			const updateResult = await updateLimitCounterByDate('2021-01-02');
			expect(updateResult).toBe(false);
		},
		apiTimeout,
	);

	it(
		'Should sucessfully update the counter for parallel queries',
		async () => {
			const targetLimit: Limit = {
				day: '2021-01-01' as t.Branded<string, dateYearMonthDayBrand>,
				counter: 100,
				limit: 100,
			};

			await expect(putBatchItemsToTable(tableLimits, [targetLimit])).resolves.not.toThrow();

			const additionalNumberRequest = 1000;
			const resultSet = await Promise.allSettled(
				Array.from(Array(targetLimit.limit + additionalNumberRequest).keys()).map(async () => updateLimitCounterByDate(targetLimit.day)),
			);
			expect(resultSet.filter((result) => result.status === 'fulfilled' && result.value === false).length).toEqual(additionalNumberRequest);
		},
		apiTimeout,
	);
});
