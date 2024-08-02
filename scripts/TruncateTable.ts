/* eslint-disable */
/// @ts-nocheck
import AWS from 'aws-sdk';
import _ from 'lodash/fp';

// SOURCE OF THIS FILE: https://advancedweb.hu/how-to-clear-a-dynamodb-table/

AWS.config.update({ region: 'eu-central-1' });

const ddb = new AWS.DynamoDB();
const MAX_RETRY_TIMES = 8

// get all results, paginating until there are no more elements
const getPaginatedResults = async (fn) => {
	const empty = Symbol('empty');
	const res = [];
	for await (const lf of (async function* () {
		let nextMarker = empty;
		while (nextMarker || nextMarker === empty) {
			const { marker, results } = await fn(nextMarker !== empty ? nextMarker : undefined);

			yield* results;
			nextMarker = marker;
		}
	})()) {
		res.push(lf);
	}

	return res;
};

const wait = async (ms) => new Promise((res) => setTimeout(res, ms));

// writes a batch of items, taking care of retrying the request when some elements are unprocessed
const batchWrite = async (items, retryCount = 0) => {
	const res = await ddb.batchWriteItem({ RequestItems: items }).promise();

	if (res.UnprocessedItems && res.UnprocessedItems.length > 0) {
		if (retryCount > MAX_RETRY_TIMES) {
			throw new Error(res.UnprocessedItems);
		}
		await wait(2 ** retryCount * 10);

		return batchWrite(res.UnprocessedItems, retryCount + 1);
	}
};

// returns the keys for a table
const getKeyDefinitions = async (table) => {
	const tableInfo = (await ddb.describeTable({ TableName: table }).promise()).Table;
	return tableInfo.KeySchema.map(({ AttributeName, KeyType }) => ({
		AttributeName: AttributeName,
		AttributeType: tableInfo.AttributeDefinitions.find((attributeDefinition) => attributeDefinition.AttributeName === AttributeName)
			.AttributeType,
		KeyType: KeyType,
	}));
};

// clears a table
export const clearTable = async (table) => {
	// get the key definitions
	const keys = await getKeyDefinitions(table);
	console.log(keys);

	// get all items
	const allItems = await getPaginatedResults(async (LastEvaluatedKey) => {
		const items = await ddb
			.scan({
				TableName: table,
				ExclusiveStartKey: LastEvaluatedKey,
				ProjectionExpression: keys.map((_k, i) => `#K${i}`).join(', '),
				ExpressionAttributeNames: _.fromPairs(keys.map(({ AttributeName }, i) => [`#K${i}`, AttributeName])),
			})
			.promise();
		return {
			marker: items.LastEvaluatedKey,
			results: items.Items,
		};
	});

	console.log("Num items: ", allItems.length);

	// make batches (batchWriteItem has a limit of 25 requests)
	const batches = _.chunk(25)(allItems);

	// send the batch deletes
	await Promise.all(
		batches.map((batch) =>
			batchWrite({
				[table]: batch.map((obj) => ({
					DeleteRequest: {
						Key: _.flow(
							_.map(({ AttributeName }) => [AttributeName, obj[AttributeName]]),
							_.fromPairs,
						)(keys),
					},
				})),
			}),
		),
	);
};

// [
// 	'INIP-INT-SMProcessMessage-Mutex',
// 	'INIP-INT-SMProcessMessage-WaitUntil',
// 	'INIP-INT-brands',
// 	'INIP-INT-consumptionfieldmapping',
// 	'INIP-INT-consumptionthememapping',
// 	'INIP-INT-photoassignments',
// 	'INIP-INT-photostudiosupdated',
// 	'INIP-INT-sectormapping',
// 	'INIP-INT-sizemappings',
// 	'INIP-INT-state',
// ].forEach(clearTable);
// clearTable("INIP-XXX-SMProcessMessage-Mutex");