import 'source-map-support/register';

import * as t from 'io-ts';

import { deleteSingleRecord } from '../../../../src/communication/DB/genericDbQueries';
import { tableState, insertNewState, getNewManualHqFmaByDestinationAndGtin } from '../../../../src/communication/DB/stateRepo';
import { apiTimeout } from '../../../utils/helpers';
import { covertToTypeGtin } from '../../../../src/validation/gtin';
import { dateToIsoTimestampString } from '../../../../src/validation/Date';
import {
	GroupedProductState_FMA_RESPONSE_RECEIVED,
	GroupedProductState_LOG_EXECUTION,
	GroupedProductState_MANUAL_HQ_FMA,
	InipStatus,
} from '../../../../src/logging/validators';
import { config } from '../../../../src/config';

const tableLatestState = `${config.stackName}-latest-state`;

describe('Test the StateRepo functions', () => {
	const mockIdentifier = '4449209444444';

	const executionLogData: GroupedProductState_LOG_EXECUTION = {
		decision: {
			next: 'Prepare FMA',
		},
		executionId: 'arn:aws:states:eu-central-1:705229686812:execution:SMProcessMessage-ZcjW8GjEN0eL:db1506fe-32c9-2760-ce6c-67fe46700b0b',
		gtin: covertToTypeGtin(mockIdentifier),
		gtinsInProduct: [covertToTypeGtin(mockIdentifier)],
		identifier: mockIdentifier,
		productTitle: "Pfanne 20 Adamant classic    Sort/ 38'20",
		status: InipStatus.LOG_EXECUTION,
		timestamp: dateToIsoTimestampString(new Date('2021-10-09T07:24:53.190Z')),
		nearestValidExpiry: undefined,
	};

	const firstFmaResponse: GroupedProductState_FMA_RESPONSE_RECEIVED = {
		executionId: 'arn:aws:states:eu-central-1:705229686812:execution:SMProcessMessage-ZcjW8GjEN0eL:db1506fe-32c9-2760-ce6c-67fe46700b0b',
		identifier: mockIdentifier,
		responsePayload: {
			amount: 1 as t.Branded<number, t.IntBrand>,
			dateOfDeliveryAtDestinationLocation: new Date('2021-08-17T00:00:00.000Z'),
			destinationLocationId: '0980000',
			fmaRequestId: 'FFQ8IJTCM7NZF6K',
			gtin: covertToTypeGtin(mockIdentifier),
			isFinal: true,
			processingStatus: 'WA',
			sapArticleNumber: '000000000104708277',
			sourceLocationId: '0000315',
			unitType: 'ST',
			outgoingGoodsDate: new Date(),
			sapDeliveryNumber: '000000104845087003',
			teNumber: '1',
		},
		status: InipStatus.FMA_RESPONSE_RECEIVED,
		timestamp: dateToIsoTimestampString(new Date('2021-10-10T07:24:53.190Z')),
		destinationLocationId: '0980000',
		fmaRequestId: 'FFQ8IJTCM7NZF6K',
		gtin: covertToTypeGtin('4999299399620'),
		procurementStartedAt: new Date('2021-09-09T07:25:18.703Z'),
		productTitle: executionLogData.productTitle,
	};

	const newManualHqFma: GroupedProductState_MANUAL_HQ_FMA = {
		executionId: 'arn:aws:states:eu-central-1:705229686812:execution:SMProcessMessage-ZcjW8GjEN0eL:db1506fe-32c9-2760-ce6c-67fe46700b0b',
		destinationLocationId: '0980000',
		gtin: covertToTypeGtin('4449209444445'),
		identifier: '4449209444445',
		status: InipStatus.MANUAL_HQ_FMA_NEW,
		timestamp: dateToIsoTimestampString(new Date('2021-10-09T07:24:53.190Z')),
		title: 'asdfasdf',
		consumptionTheme: 400255,
		brand: '2508',
		size: null,
		color: null,
	};

	const allStates = [executionLogData, firstFmaResponse, newManualHqFma];

	afterAll(async () => {
		// Remove LOG_EXECUTION, FMA_RESPONSE_RECEIVED state
		await Promise.all(
			allStates.map(async (state) => {
				await deleteSingleRecord(tableState, {
					identifier: state.identifier,
					timestamp: state.timestamp,
				});
			}),
		);

		// Remove FMA_RESPONSE_RECEIVED, MANUAL_HQ_FMA::NEW state
		await Promise.all(
			[firstFmaResponse, newManualHqFma].map(async (state) => {
				await deleteSingleRecord(tableLatestState, {
					identifier: state.identifier,
				});
			}),
		);
	});

	it(
		'LOG_EXECUTION state should be imported into state table, not latest state',
		async () => {
			await expect(insertNewState(executionLogData)).resolves.not.toThrow();
		},
		apiTimeout,
	);

	it(
		'FMA_RESPONSE_RECEIVED state should be imported into both of state and latest table',
		async () => {
			await expect(insertNewState(firstFmaResponse)).resolves.not.toThrow();
		},
		apiTimeout,
	);

	it(
		'MANUAL_HQ_FMA::NEW should be found when searching with destinationLocationId and gtin',
		async () => {
			await expect(insertNewState(newManualHqFma)).resolves.not.toThrow();
			const manualFma = await getNewManualHqFmaByDestinationAndGtin('0980000', covertToTypeGtin('4449209444445'));
			expect(manualFma.status).toEqual('MANUAL_HQ_FMA::NEW');
		},
		apiTimeout,
	);
});
