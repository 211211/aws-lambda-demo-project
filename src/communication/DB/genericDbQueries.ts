import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { isLeft } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { v4 as uuidv4 } from 'uuid';

import { InvalidDynamoDbResultError, InvalidParameterValueError, MalformedDynamoDbResultError } from '../../errors';
import { splitArrayToChunks } from '../../utils/array';
import { getDbClient, writeToDBQueue } from '../../utils/dbClient';
import { hasOwnProperty } from '../../utils/ts';

const documentClient = getDbClient().documentClient;

export async function getAllRecords<T>(tableName: string, validator: t.Type<T, unknown, unknown>): Promise<T[]> {
	return scanFullTable({ TableName: tableName }, validator);
}

/**
 * Scans a Table until the maxResults is reached.
 *
 * maxReults is only a soft limit, you may receive more records than the limit.
 *
 * @param params Params for the ScanInput
 * @param validator Validator to validate the output
 * @param maxResults Maximum number of records to return. This will save on read capacity units.
 * @returns
 */
export async function scanFullTable<T>(
	params: DynamoDB.DocumentClient.ScanInput,
	validator: t.Type<T, unknown, unknown>,
	maxResults: number = Number.MAX_VALUE,
): Promise<T[]> {
	if (params.TableName.length === 0) throw new Error('Invalid table name');

	const items: DynamoDB.DocumentClient.AttributeMap[] = [];
	let queryResult = await documentClient.scan(params).promise();

	if (queryResult.Items == null) throw new InvalidDynamoDbResultError('Received nullish result.Items property');
	items.push(...queryResult.Items);

	// In case the result set is bigger than 1MB, DynamoDB will paginate
	// And we have to query more using the LastEvaluatedKey to get the next result
	// https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.Pagination.html
	while (typeof queryResult.LastEvaluatedKey !== 'undefined' && items.length < maxResults) {
		params.ExclusiveStartKey = queryResult.LastEvaluatedKey;
		queryResult = await documentClient.scan(params).promise();
		if (queryResult.Items == null) throw new InvalidDynamoDbResultError('Received nullish result.Items property');
		items.push(...queryResult.Items);
	}

	const mapped = items.map((item) => validator.decode(item));
	const errors = mapped.filter((item) => {
		if (isLeft(item)) {
			// Useful for debugging which items are invalid
			console.log(JSON.stringify(item));
			return item;
		}

		return false;
	});
	if (errors.length > 0)
		throw new MalformedDynamoDbResultError(`Received ${errors.length} malformed results from Table ${params.TableName}`, errors[0]);

	/// @ts-expect-error this should only return right results.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return mapped.map((item) => item.right);
}

/**
 * Scans a Table until the maxResults is reached.
 *
 * maxReults is only a soft limit, you may receive more records than the limit.
 *
 * @param params Params for the ScanInput
 * @param validator Validator to validate the output
 * @returns
 */
export async function queryTable<T>(params: DynamoDB.DocumentClient.QueryInput, validator: t.Type<T, unknown, unknown>): Promise<T[]> {
	if (params.TableName.length === 0) throw new Error('Invalid table name');

	const items: DynamoDB.DocumentClient.AttributeMap[] = [];
	let queryResult = await documentClient.query(params).promise();

	if (queryResult.Items == null) throw new InvalidDynamoDbResultError('Received nullish result.Items property');
	items.push(...queryResult.Items);

	// In case the result set is bigger than 1MB, DynamoDB will paginate
	// And we have to query more using the LastEvaluatedKey to get the next result
	// https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.Pagination.html
	while (typeof queryResult.LastEvaluatedKey !== 'undefined') {
		params.ExclusiveStartKey = queryResult.LastEvaluatedKey;
		queryResult = await documentClient.query(params).promise();
		if (queryResult.Items == null) throw new InvalidDynamoDbResultError('Received nullish result.Items property');
		items.push(...queryResult.Items);
	}

	const mapped = items.map((item) => validator.decode(item));
	const errors = mapped.filter((item) => isLeft(item));
	if (errors.length > 0)
		throw new MalformedDynamoDbResultError(`Received ${errors.length} malformed results from Table ${params.TableName}`, errors[0]);

	/// @ts-expect-error this should only return right results.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return mapped.map((item) => item.right);
}

export async function findSingleRecordByKey<T>(
	tableName: string,
	key: Record<string, unknown>,
	validator: t.Type<T, unknown, unknown>,
): Promise<T | undefined> {
	const params: DocumentClient.GetItemInput = {
		Key: {
			...key,
		},
		TableName: tableName,
	};
	const queryResult = await documentClient.get(params).promise();
	if (queryResult.Item == null) return undefined;

	const validationResult = validator.decode(queryResult.Item);
	if (isLeft(validationResult)) throw new MalformedDynamoDbResultError(`Received a malformed results from Table ${tableName}`, validationResult);

	return validationResult.right;
}

export async function deleteSingleRecord(tableName: string, key: Record<string, unknown>): Promise<void> {
	const params: DocumentClient.DeleteItemInput = {
		Key: {
			...key,
		},
		TableName: tableName,
	};
	const queryResult = await documentClient.delete(params).promise();
	if (queryResult.$response.error) throw queryResult.$response.error;
}

export async function putBatchItems(items: DynamoDB.DocumentClient.TransactWriteItemList): Promise<void> {
	if (items.length === 0) return;

	// BatchWriteItem only accepts maximum 25 requests
	const splittedRequestArray = splitArrayToChunks(items, 25).map((itms) => ({
		items: itms,
		token: uuidv4(),
	}));

	const promises = splittedRequestArray.map(async (item) => writeToDBQueue.pushAsync(item));
	await Promise.all(promises);
}

export async function putBatchItemsToTable<T>(tableName: string, items: T[]): Promise<void> {
	if (items.length === 0) return;

	const parsedItems = JSON.parse(JSON.stringify(items)) as T[];

	const putRequests = parsedItems.map((item) => ({
		Put: {
			TableName: tableName,
			Item: item,
		},
	}));

	// BatchWriteItem only accepts maximum 25 requests
	const splittedRequestArray = splitArrayToChunks(putRequests, 25).map((itms) => ({
		items: itms,
		token: uuidv4(),
	}));

	const promises = splittedRequestArray.map(async (item) => writeToDBQueue.pushAsync(item));
	await Promise.all(promises);
}

export interface AdditionalUpdateParams {
	ExpressionAttributeValues: DocumentClient.ExpressionAttributeValueMap;
	ExpressionAttributeNames: DocumentClient.ExpressionAttributeNameMap;
	ConditionExpression?: string;
}

/**
 * Generate update parameters for an dynamoDB query
 */
function generateUpdateItemParams<T>(
	tableName: string,
	item: T,
	keys: Record<string, any>,
	additionalUpdateParams: AdditionalUpdateParams = {
		ExpressionAttributeValues: {},
		ExpressionAttributeNames: {},
	},
) {
	const updateParams = {
		TableName: tableName,
		Key: {
			...keys,
		},
		UpdateExpression: '',
		...additionalUpdateParams,
	};

	const expressionAttributeValues: Record<string, any> = {};
	const expressionAttributeNames: Record<string, any> = {};
	const numberOfUpdateProps = Object.keys(item).length - Object.keys(keys).length;
	let updatePropCount = 0;
	Object.keys(item).forEach((prop, index) => {
		const curPropAlias = `#prop${index}`;
		// Ignore keys
		if (hasOwnProperty(keys, prop)) return;

		if (updateParams.UpdateExpression?.length === 0) {
			updateParams.UpdateExpression += 'SET';
		}
		updateParams.UpdateExpression += ` ${curPropAlias} = :${prop}`;
		updateParams.UpdateExpression += updatePropCount < numberOfUpdateProps - 1 ? ',' : '';

		expressionAttributeNames[curPropAlias] = prop;

		// This one will never happen, just for eslint checking
		if (!hasOwnProperty(item, prop)) throw new InvalidParameterValueError(`Unknown prop named ${prop} in sizeMappingItem`);
		expressionAttributeValues[`:${prop}`] = item[prop];
		updatePropCount++;
	});

	updateParams.ExpressionAttributeValues = { ...updateParams.ExpressionAttributeValues, ...expressionAttributeValues };
	updateParams.ExpressionAttributeNames = { ...updateParams.ExpressionAttributeNames, ...expressionAttributeNames };

	return updateParams;
}

/**
 * Send batch update requests to DynamoDB
 *
 * @param tableName
 * @param items
 * @param keys: an array of primary key (min: 1 key, max: 2 keys)
 */
export async function updateBatchItemsToTable<T>(tableName: string, items: T[], keys: string[]): Promise<void> {
	if (typeof tableName !== 'string' || tableName.length === 0) throw new InvalidParameterValueError(`Invalid tableName ${tableName}`);
	if (items.length === 0) return;

	const parsedItems = JSON.parse(JSON.stringify(items)) as T[];

	// DynamoDB only allow maximum 2 keys
	if (keys.length === 0 || keys.length > 2)
		throw new InvalidParameterValueError(`keys must has more than or equal 1 key and less than 2 keys, received ${keys.length} keys`);

	const requests = parsedItems.map((item) => {
		const keyPairs: Record<string, any> = {};
		keys.forEach((key) => {
			if (!hasOwnProperty(item, key)) throw new InvalidParameterValueError(`Unknown prop named ${key} in item ${JSON.stringify(item)}`);
			keyPairs[key] = item[key];
		});

		return {
			Update: {
				...generateUpdateItemParams(tableName, item, keyPairs),
			},
		};
	});

	// BatchWriteItem only accepts maximum 25 requests
	const splittedRequestArray = splitArrayToChunks(requests, 25).map((itms) => ({
		items: itms,
		token: uuidv4(),
	}));

	const promises = splittedRequestArray.map(async (item) => writeToDBQueue.pushAsync(item));
	await Promise.all(promises);
}

export interface CustomizeUpdateItems {
	tableName: string;
	item: Record<string, unknown>;
	additionalUpdateParams?: AdditionalUpdateParams;
	keys: string[];
}

/**
 * update batch item to multiple tables
 */
export async function updateBatchItems(updateItems: CustomizeUpdateItems[]): Promise<void> {
	if (updateItems.length === 0) return;

	const parsedItems = JSON.parse(JSON.stringify(updateItems)) as Array<{
		tableName: string;
		item: Record<string, unknown>;
		additionalUpdateParams?: AdditionalUpdateParams;
		keys: string[];
	}>;

	const requests: DynamoDB.DocumentClient.TransactWriteItemList = [];
	parsedItems.forEach((curItemForUpdate) => {
		// DynamoDB only allow maximum 2 keys
		const { keys, item, tableName, additionalUpdateParams } = curItemForUpdate;
		if (keys.length === 0 || keys.length > 2)
			throw new InvalidParameterValueError(`keys must has more than or equal 1 key and less than 2 keys, received ${keys.length} keys`);

		const keyPairs: Record<string, any> = {};
		keys.forEach((key) => {
			if (!hasOwnProperty(item, key))
				throw new InvalidParameterValueError(`Unknown prop named ${key} in item ${JSON.stringify(curItemForUpdate)}`);
			keyPairs[key] = item[key];
		});

		requests.push({
			Update: {
				...generateUpdateItemParams(tableName, item, keyPairs, additionalUpdateParams),
			},
		});
	});

	// BatchWriteItem only accepts maximum 24 requests
	const splittedRequestArray = splitArrayToChunks(requests, 24).map((itms) => ({
		items: itms,
		token: uuidv4(),
	}));

	const promises = splittedRequestArray.map(async (item) => writeToDBQueue.pushAsync(item));
	await Promise.all(promises);
}

/**
 * Update or add item by keys
 * The keys will be ignore in updating
 */
export async function updateItem<T>(tableName: string, item: T, keys: Record<string, any>): Promise<void> {
	if (typeof tableName !== 'string' || tableName.length === 0) throw new InvalidParameterValueError(`Invalid tableName ${tableName}`);
	if (item == null) throw new InvalidParameterValueError(`Empty item`);
	if (keys == null || Object.keys(keys).length === 0) throw new InvalidParameterValueError(`Empty keys`);

	const updateParams = generateUpdateItemParams(tableName, item, keys);

	await documentClient.update(updateParams).promise();
}
