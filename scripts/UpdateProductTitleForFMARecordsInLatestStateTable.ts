import async from 'async';
import { isLeft } from 'fp-ts/lib/Either';
import * as t from 'io-ts';

import { queryTable, updateBatchItemsToTable } from '../src/communication/DB/genericDbQueries';
import { tableState } from '../src/communication/DB/stateRepo';
import { getArticleFromPL } from '../src/communication/ProductLake';
import { EChannels } from '../src/communication/ProductLake/channels';
import { config } from '../src/config';
import { MalformedThingError } from '../src/errors/MalformedThing';
import { Article } from '../src/lib/api-productlake';
import { GroupedProductState_FMA_REQUEST_SENT, GroupedProductState_FMA_RESPONSE_RECEIVED, InipStatus } from '../src/logging/validators';
import { getArticleTitle } from '../src/processing/Article';
import { removeNullableFromArr } from '../src/utils/general';

const tableLatestState = `${config.stackName}-latest-state`;

/**
 * StackName=INIP-TEST npm run ts-node ./scripts/UpdateProductTitleForFMARecordsInLatestStateTable.ts
 */
void (async () => {
	try {
		console.time();
		console.log('fetch all FMA_REQUEST_SENT and FMA_RESPONSE_RECEIVED from latest state table');
		// get records which have status is GroupedProductState_FMA_REQUEST_SENT or FMA_RESPONSE_RECEIVED from latest state table
		const latestStates = await getAllLatestFmaRecordsWithoutProductTitle();
		console.log('fetch all FMA_REQUEST_SENT and FMA_RESPONSE_RECEIVED from latest state table', latestStates.length);

		// gtins from latestStates
		const gtins = new Set(latestStates.map((latestState) => latestState.gtin));

		let articles: Article[] = (await Promise.all(Array.from(gtins).map(fetchArticleByGtin))) ?? [];
		articles = removeNullableFromArr(articles);
		console.log(`Finish fetching data from PL, got ${articles.length} articles`);
		if (articles.length === 0) {
			console.log('Stop script execution');
			return Promise.resolve();
		}

		const productTitleMap = new Map();
		articles.forEach((article: Article) => {
			productTitleMap.set(article.gtin, getArticleTitle(article));
		});

		const mappedLatestStates = latestStates.map((latestState) => {
			latestState.productTitle = productTitleMap.get(latestState.gtin) as string;
			return latestState;
		});

		console.log(
			`Start updating product title for all records which have status is FMA_REQUEST_SENT and FMA_RESPONSE_RECEIVED status in ${tableLatestState} table`,
		);
		await updateBatchItemsToTable(tableLatestState, mappedLatestStates, ['identifier']);

		console.log(
			`Start updating product title for all records which have status is FMA_REQUEST_SENT and FMA_RESPONSE_RECEIVED status in ${tableState} table`,
		);
		await updateBatchItemsToTable(tableState, mappedLatestStates, ['identifier', 'timestamp']);

		console.log('Finish migrating');
	} catch (e) {
		console.log('Failed to execute script', e);
	}
})();

async function fetchArticleByGtin(gtin: string): Promise<Article> {
	const articleFromPl = await async.retry(
		{
			times: 3,
			interval: 500,
		},
		(cb) => {
			getArticleFromPL(gtin, EChannels.sapForward).then(
				(article) => cb(null, article),
				(error) => cb(error),
			);
		},
	);
	const validation = Article.decode(articleFromPl);
	if (isLeft(validation)) throw new MalformedThingError('Got an malformed article from PL', validation);
	return Promise.resolve(validation.right);
}

async function getAllLatestFmaRecordsWithoutProductTitle(): Promise<
	Array<GroupedProductState_FMA_RESPONSE_RECEIVED | GroupedProductState_FMA_REQUEST_SENT>
> {
	const fmaRequestSentRecords = await fetchlatestStatesByStatusWithoutProductTitle(
		InipStatus.FMA_REQUEST_SENT,
		GroupedProductState_FMA_REQUEST_SENT,
	);
	const fmaResponseReceivedRecords = await fetchlatestStatesByStatusWithoutProductTitle(
		InipStatus.FMA_RESPONSE_RECEIVED,
		GroupedProductState_FMA_RESPONSE_RECEIVED,
	);
	return [...fmaRequestSentRecords, ...fmaResponseReceivedRecords];
}

async function fetchlatestStatesByStatusWithoutProductTitle<T>(status: InipStatus, validator: t.Type<T, unknown, unknown>): Promise<T[]> {
	return queryTable(
		{
			TableName: tableLatestState,
			IndexName: 'idx_status_identifier',
			KeyConditionExpression: '#prop = :status',
			FilterExpression: 'size(#productTitle) = :nonEmptyLength',
			ExpressionAttributeNames: {
				'#prop': 'status',
				'#productTitle': 'productTitle',
			},
			ExpressionAttributeValues: {
				':status': status,
				':nonEmptyLength': 0,
			},
		},
		validator,
	);
}
