import 'source-map-support/register';

// eslint-disable-next-line import/order
// import bluebird from '../other/bluebird';

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
require('dotenv').config({});

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
require('../other/axios').enableAxiosTiming();

import fs from 'fs';
import path from 'path';
import async from 'async';
import * as t from 'io-ts';
import { isLeft, isRight } from 'fp-ts/lib/Either';
import { Parser } from 'json2csv';

import { AssignmentData, AssignmentDataFailure, AssignmentDataSuccess, TransferStructure } from '../DataStructure';
import { fetchArticleHandler as handlerFetchArticle } from '../handlers/FetchArticle';
import { handler as handlerFetchProduct } from '../handlers/FetchProduct';
import { handler as handlerFetchVvb } from '../handlers/FetchvvB';
import { handler as handlerFetchImages } from '../handlers/FetchImages';
import { handler as handlerFetchSizemapping } from '../handlers/FetchSizemapping';
import { handler as handlerProcessGathering } from '../handlers/ProcessGatheringResults';
import { hasOwnProperty } from '../utils/ts';
import { removeNullableFromArr, requireSingleValue } from '../utils/general';
import { Article } from '../lib/api-productlake';
import { filterAndOrderArticlesBySizeMapping, getSizeFromArticle } from '../processing/Size';
import { MalformedInputError } from '../errors';
import { getCurrentPhotoStudioFromAssignment } from '../communication/DB/ktAssignmentRepo';
import { createTimeProxy } from '../other/time';
import { splitArrayToChunks } from '../utils/array';
import { gtins } from './gtins-2021-08-23-INT-full.debug';
const filePrefix = 'GTINs-INT-FULL';

// const gtins = ['2246113576058'];

// const gtins = [
// 	'4004633162100',
// 	'4009209367651',
// 	'4020728201431',
// 	'5203069063633',
// 	'4011707740478',
// 	'4011707740492',
// 	'4011700447039',
// 	'4017166550269',
// 	'4011700447404',
// 	'4011700447404',
// 	'4011700447039',
// 	'4011700447404',
// 	'4011700447343',
// ];

// const uniqueGtins = Array.from(new Set(gtins)).slice(0, 999999);

// console.log(`Got ${gtins.length} GTINs`);
// if (uniqueGtins.length !== gtins.length) {
// 	console.log(`Got ${uniqueGtins.length} unique GTINs, there were ${gtins.length - uniqueGtins.length} duplicates.`);
// }

interface Task {
	gtin: string;

	resolve: (data: returnData) => void;
	reject: (error: any) => void;
}

// time to log
const ttl = 30_000;

const checkedGtins = new Set<string>([]);
const queue = async.queue((task: Task, cbQueue) => {
	const handlerErr = (err: unknown) => {
		console.error('Error occured: ', err);
		checkedGtins.add(task.gtin);

		task.reject(err);
		cbQueue(null);
	};

	const handleSuccess = (data: returnData) => {
		checkedGtins.add(task.gtin);
		console.log(`Current Progress: ${checkedGtins.size}`);
		task.resolve(data);
		cbQueue(null);
	};

	crawl(task.gtin).then(handleSuccess, handlerErr);

	// async.autoInject(
	// 	{
	// 		getGtin: (cb: AsyncResultCallback<string>) => cb(null, task.gtin),
	// 		fetchArticle: (getGtin: TransferStructure, cb: AsyncResultCallback<TransferStructure>) =>
	// 			void createTimeProxy(handlerFetchArticle, ttl)(getGtin).then((res) => cb(null, res), cb),
	// 		fetchProduct: (fetchArticle: TransferStructure, cb: AsyncResultCallback<TransferStructure>) =>
	// 			void createTimeProxy(handlerFetchProduct, ttl)(fetchArticle).then((res) => cb(null, res), cb),
	// 		fetchVvb: (fetchProduct: TransferStructure, cb: AsyncResultCallback<ParsedVvbData>) =>
	// 			void createTimeProxy(handlerFetchVvb, ttl)(fetchProduct).then((res) => cb(null, res), cb),
	// 		fetchImages: (fetchProduct: TransferStructure, cb: AsyncResultCallback<ParsedImageValidity>) =>
	// 			void createTimeProxy(handlerFetchImages, ttl)(fetchProduct).then((res) => cb(null, res), cb),
	// 		fetchSizemapping: (fetchProduct: TransferStructure, cb: AsyncResultCallback<AssignmentData>) =>
	// 			void createTimeProxy(handlerFetchSizemapping, ttl)(fetchProduct).then((res) => cb(null, res), cb),
	// 		processGathering: (
	// 			fetchProduct: TransferStructure,
	// 			fetchVvb: ParsedVvbData,
	// 			fetchImages: ParsedImageValidity,
	// 			fetchSizemapping: AssignmentData,
	// 			cb: AsyncResultCallback<TransferStructure>,
	// 		) =>
	// 			void createTimeProxy(
	// 				handlerProcessGathering,
	// 				ttl,
	// 			)([fetchProduct, fetchVvb, fetchImages, fetchSizemapping]).then((res) => cb(null, res), cb),
	// 	},
	// 	(err, results) => {
	// 		if (err) {
	// 			return void handlerErr(err);
	// 		}
	// 		return void handleSuccess(results);
	// 	},
	// );
}, 200);

async function crawl(gtin: string): Promise<returnData> {
	// const tsArticle = await createTimeProxy(handlerFetchArticle, ttl, ['handlerFetchArticle', gtin])(gtin);
	// const tsProduct = await createTimeProxy(handlerFetchProduct, ttl, ['handlerFetchProduct', gtin])(tsArticle);
	const tsArticle = await handlerFetchArticle(gtin);
	const tsProduct = await handlerFetchProduct(tsArticle);
	const vvb = await createTimeProxy(handlerFetchVvb, ttl, ['handlerFetchVvb', gtin])(tsProduct);
	const media = await createTimeProxy(handlerFetchImages, ttl, ['handlerFetchImages', gtin])(tsProduct);
	const sm = await createTimeProxy(handlerFetchSizemapping, ttl, ['handlerFetchSizemapping', gtin])(tsProduct);
	const gathering = await createTimeProxy(handlerProcessGathering, ttl, ['handlerProcessGathering', gtin])([tsProduct, vvb, media, sm, []]);

	return {
		getGtin: gtin,
		fetchArticle: tsArticle,
		fetchProduct: tsProduct,
		fetchSizemapping: sm,
		processGathering: gathering,
	};
}

const returnData = t.type({
	getGtin: t.string,
	fetchArticle: TransferStructure,
	fetchProduct: TransferStructure,
	fetchSizemapping: AssignmentData,
	processGathering: TransferStructure,
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
type returnData = t.TypeOf<typeof returnData>;

function hasWebshopFlag(article: Article | null | undefined): boolean {
	/// @ts-expect-error // this is not in the api specification yet
	return article?.articleAttributes?.attributeX_gkkSapForward_webshopFlag === 'J';
}

async function analyze(listGtins: string[]) {
	// console.log('GTINS: ', listGtins);
	const promises = listGtins.map(
		async (gtin) =>
			new Promise((resolve, reject) => {
				void queue.push({
					gtin: gtin,
					resolve: resolve,
					reject: reject,
				});
			}),
	);

	// const res = await bluebird.allSettled(promises);
	const res = await Promise.allSettled(promises);

	const data = res.map((d, index) => {
		try {
			// if (d.isRejected()) throw d.reason();
			// const parsedData = returnData.decode(d.value());
			if (d.status === 'rejected') throw d.reason;
			const parsedData = returnData.decode(d.value);

			if (isLeft(parsedData)) throw new MalformedInputError('Received Malformed data', parsedData);

			const curData = parsedData.right;
			const gathering = curData.processGathering;

			if (gathering.product == null) throw new Error('Missing Product');
			const product = gathering.product;

			const vvbData = {
				vvbProduct: undefined as unknown,
			};
			if (gathering.vvb != null && hasOwnProperty(gathering.vvb, 'resultList')) {
				vvbData.vvbProduct = gathering.vvb.sum;
			}

			const validationAssignmentData = AssignmentDataSuccess.decode(curData.fetchSizemapping);
			if (isLeft(validationAssignmentData)) {
				const valErr = AssignmentDataFailure.decode(curData.fetchSizemapping);
				if (isRight(valErr)) {
					throw new Error(`Error in SizeMapping: ${JSON.stringify(valErr)}`);
				} else {
					throw new Error('Unknown error in SizeMapping');
				}
			}
			const assignmentData = validationAssignmentData.right;

			const curAssignmentItem =
				assignmentData.photoAssignment != null ? getCurrentPhotoStudioFromAssignment(assignmentData.photoAssignment) : undefined;

			const sizeMapping = assignmentData.sizeMapping;
			const sm = {
				sizesInProduct: product.articles.map(getSizeFromArticle),
				sizeMapping: sizeMapping?.sizes,
				productionAllowed: sizeMapping?.productionAllowed,
				currentPhotoStudio: curAssignmentItem?.photostudio,
				chosenGtin: undefined as string | undefined,
				chosenSize: undefined as string | undefined,
			};
			if (sizeMapping != null) {
				const fmaData = filterAndOrderArticlesBySizeMapping(product.articles, sizeMapping);
				const firstArticle = fmaData[0];
				if (firstArticle != null) {
					sm.chosenGtin = firstArticle.gtin;
					sm.chosenSize = getSizeFromArticle(firstArticle);
				}
			}

			// TODO: return error instead
			const validationAssignment = AssignmentDataSuccess.decode(gathering.assignmentData);
			if (isLeft(validationAssignment)) throw new MalformedInputError('Invalid validation assignment', validationAssignment);
			const validationData = validationAssignment.right;

			return {
				groupIdentifier: gathering.groupIdentifier,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				artikelTyp: requireSingleValue(
					/// @ts-expect-error // aux is an empty object in the definiton
					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					product.articles.map((article) => article?.references?.supplyChain?.[0].aux?.artikelTyp),
					true,
				),
				numArticlesInProduct: gathering.product?.articles.length,
				gtins: product.articles.map((article) => article.gtin).join(', '),

				classification: requireSingleValue(
					product.articles?.map((article) => article.classification?.main),
					true,
				),
				webshopFlag: requireSingleValue(product.articles?.map(hasWebshopFlag), true),

				choice: gathering.decision?.next,
				...validationData.selector,

				numMediaProductValid: gathering.media?.numValid,
				mediaValid: gathering.media?.pass,
				...vvbData,
				...sm,
			};
		} catch (err) {
			if (err instanceof Error)
				return {
					gtin: listGtins[index],
					ErrorType: err.name,
					ErrorMessage: err.toString(),
				};
			return;
		}
	});

	return removeNullableFromArr(data);
}

const fields = [
	'groupIdentifier',
	'artikelTyp',
	'numArticlesInProduct',
	'gtins',

	'sizesInProduct',
	'sizeMapping',
	'sizesMatching',
	'productionAllowed',
	'currentPhotoStudio',
	'chosenGtin',
	'chosenSize',

	'classification',
	'webshopFlag',
	'choice',

	// selector
	'brand',
	'consumptionTheme',
	'targetGroup',

	'mediaValid',
	'numMediaProductValid',
	'vvbProduct',
];

const fieldsErr = ['gtin', 'ErrorType', 'ErrorMessage'];

const parser = new Parser({ fields: fields });
const parserErr = new Parser({ fields: fieldsErr });

async function processBatch(listGtins: string[]) {
	const data = await analyze(listGtins);
	const identifierMap = new Map();
	const errorMap = new Map();
	data.forEach((item) => {
		if (item.ErrorType != null) {
			errorMap.set(item.gtin, item);
		} else {
			identifierMap.set(item.groupIdentifier, item);
		}
	});

	const fileNameBase = `${filePrefix}-${new Date().toISOString()}`;

	const csv = parser.parse(Array.from(identifierMap.values()));
	const filePath = path.resolve(__dirname, `${fileNameBase}.csv`);

	fs.writeFileSync(filePath, csv);
	console.log('Written csv to ', filePath);

	if (errorMap.size > 0) {
		const csvErr = parserErr.parse(Array.from(errorMap.values()));
		const filePathErr = path.resolve(__dirname, `${fileNameBase}-Errors.csv`);

		fs.writeFileSync(filePathErr, csvErr);
		console.log(`${errorMap.size} Error occured, written to: `, filePathErr);
	}
}

const batchSize = 2_000;
async function loop() {
	// let gtins = await getNextXGtins(batchSize);
	// while (gtins.length > 0) {
	// 	await processBatch(gtins);

	// 	gtins = await getNextXGtins(batchSize);
	// }

	const uniqueGtins = Array.from(new Set(gtins));
	console.log(`Got ${gtins.length}, unique GTINs: ${uniqueGtins.length}`);

	const batches = splitArrayToChunks(uniqueGtins, batchSize);
	for (const batch of batches) {
		await processBatch(batch);
	}
}

void loop().then(console.log, console.error);
