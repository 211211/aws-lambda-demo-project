import * as AWS from 'aws-sdk';
import async from 'async';
import DynamoDB from 'aws-sdk/clients/dynamodb';

import { config } from '../config';

let dbClient: DynamoDB | undefined;
let documentClient: DynamoDB.DocumentClient | undefined;

export function getDbClient(): { dbClient: DynamoDB; documentClient: DynamoDB.DocumentClient } {
	// Check if the requested client was initialized
	if (typeof dbClient !== 'undefined' && typeof documentClient !== 'undefined')
		return {
			dbClient: dbClient,
			documentClient: documentClient,
		};

	const dbConfig: DynamoDB.ClientConfiguration = {};

	// Validate the env variables
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { db, region } = config;

	if (db?.accessKeyId != null && db?.secretAccessKey != null) {
		AWS.config.update({ accessKeyId: db?.accessKeyId, secretAccessKey: db?.secretAccessKey });
	}

	if (db?.dbEndpoint != null && db?.dbEndpoint.length > 0) {
		dbConfig.endpoint = db?.dbEndpoint;
	}

	if (db?.enableSsl != null && typeof db?.enableSsl === 'boolean') {
		dbConfig.sslEnabled = db?.enableSsl;
	}

	if (region != null && region.length > 0) {
		dbConfig.region = region;
	}

	dbClient = new DynamoDB(dbConfig);
	documentClient = new DynamoDB.DocumentClient(dbConfig);

	return {
		dbClient: dbClient,
		documentClient: documentClient,
	};
}

export const writeToDBQueue = async.queue(writeToDB, 4);
function writeToDB(
	task: {
		token: string;
		items: DynamoDB.DocumentClient.TransactWriteItemList;
	},
	cb: async.AsyncResultCallback<DynamoDB.DocumentClient.TransactWriteItemsOutput>,
): void {
	const docClient = getDbClient().documentClient;

	async
		.retry<DynamoDB.DocumentClient.TransactWriteItemsOutput>(
			{
				times: 5,
				interval: 100,
			},
			(innerCb) => {
				docClient
					.transactWrite({
						// ClientRequestToken makes multiple identical calls have the same effect as one single call.
						// A client request token is valid for 10 minutes after the first request that uses it is completed
						ClientRequestToken: task.token,
						TransactItems: task.items.map((item) => {
							if (item.Put == null) return item;
							// The below execution will convert date properties to ISO timestamp string
							item.Put.Item = JSON.parse(JSON.stringify(item.Put.Item)) as DynamoDB.DocumentClient.PutItemInputAttributeMap;
							return item;
						}),
					})
					.promise()
					.then(
						(res) => innerCb(null, res),
						(err) => innerCb(err),
					);
			},
		)
		.then(
			(res) => cb(null, res),
			(err) => cb(err),
		);
}
