import { DynamoDB } from 'aws-sdk';
import { isLeft } from 'fp-ts/lib/Either';
import { putBatchItemsToTable } from '../src/communication/DB/genericDbQueries';
import { tableState } from '../src/communication/DB/stateRepo';
import { config } from '../src/config';
import { InvalidDynamoDbResultError, MalformedDynamoDbResultError } from '../src/errors';
import { GroupedProductState, InipStatus } from '../src/logging/validators';
import { getDbClient } from '../src/utils/dbClient';
const documentClient = getDbClient().documentClient;
const tableLatestState = `${config.stackName}-latest-state`;

/**
 * StackName=INIP-TEST npm run ts-node ./scripts/MigrateLatestStateRecords.ts
 */
void (async () => {
	try {
		console.log('Start scanning all non log records');
		const identifierAndLatestTimeStampMapping = new Map<string, GroupedProductState>();

		await Promise.all(
			Object.values(InipStatus).map(async (inipStatus) => {
				if (inipStatus === InipStatus.LOG_EXECUTION) return Promise.resolve();
				const params: DynamoDB.DocumentClient.QueryInput = {
					TableName: tableState,
					IndexName: 'idx_status_timestamp',
					KeyConditionExpression: '#status = :status',
					ExpressionAttributeNames: {
						'#status': 'status',
					},
					ExpressionAttributeValues: {
						':status': inipStatus,
					},
					ScanIndexForward: false,
				};

				let queryResult = await documentClient.query(params).promise();
				let validatedRecords = validateItems(queryResult.Items);
				updateIdentifierMap(identifierAndLatestTimeStampMapping, validatedRecords);

				// In case the result set is bigger than 1MB, DynamoDB will paginate
				// And we have to query more using the LastEvaluatedKey to get the next result
				// https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.Pagination.html
				while (typeof queryResult.LastEvaluatedKey !== 'undefined') {
					params.ExclusiveStartKey = queryResult.LastEvaluatedKey;
					queryResult = await documentClient.query(params).promise();
					if (queryResult.Items == null) throw new InvalidDynamoDbResultError('Received nullish result.Items property');
					validatedRecords = validateItems(queryResult.Items);
					updateIdentifierMap(identifierAndLatestTimeStampMapping, validatedRecords);
				}
			}),
		);
		console.log('Finish scanning all non log records');

		console.log(`Start migrating latest state records to ${tableLatestState}`);
		await putBatchItemsToTable(tableLatestState, Array.from(identifierAndLatestTimeStampMapping.values()));
		console.log('Finish migrating');
	} catch (e) {
		console.log('Failed to execute script', e);
	}
})();

function updateIdentifierMap(identifierAndLatestTimeStampMapping: Map<string, GroupedProductState>, items: GroupedProductState[]) {
	items.forEach((item) => {
		if (identifierAndLatestTimeStampMapping.has(item.identifier) === false) identifierAndLatestTimeStampMapping.set(item.identifier, item);
		const targetTimeStamp = new Date(item.timestamp);
		const currentItem = identifierAndLatestTimeStampMapping.get(item.identifier);
		if (currentItem == null) throw new Error('It should not happen');
		const currentTimeStamp = new Date(currentItem.timestamp);
		if (targetTimeStamp.getTime() <= currentTimeStamp.getTime()) return;
		identifierAndLatestTimeStampMapping.set(item.identifier, item);
	});
}

function validateItems(items: DynamoDB.DocumentClient.ItemList | undefined): GroupedProductState[] {
	if (items == null) throw new InvalidDynamoDbResultError('Received nullish result.Items property');
	const mapped = items.map((item) => GroupedProductState.decode(item));
	const errors = mapped.filter((validation) => isLeft(validation));
	if (errors.length > 0) {
		console.log(JSON.stringify(items.find((item) => isLeft(GroupedProductState.decode(item)))));
		throw new MalformedDynamoDbResultError('Got malformed GroupedProductState records', errors[0]);
	}
	/// @ts-expect-error this should only return right results.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return mapped.map((item) => item.right);
}
