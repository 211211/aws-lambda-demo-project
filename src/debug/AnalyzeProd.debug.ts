import 'source-map-support/register';

import fs from 'fs';
import path from 'path';
/// @ts-expect-error // we dont have types for this.
import CFonts from 'cfonts';
import async, { AsyncResultCallback } from 'async';
import { Parser } from 'json2csv';

import { TransferStructure } from '../DataStructure';
import { MalformedThingError } from '../errors/MalformedThing';
import { Article, AttributeGenericMaterialFashion } from '../lib/api-productlake';
import { MandateProps } from '../utils/ts';
import { getArticleFromPL } from '../communication/ProductLake';
import { EChannels } from '../communication/ProductLake/channels';
import { splitArrayToChunks } from '../utils/array';
import { gtins } from './gtins1800.debug';

interface Task {
	gtin: string;

	resolve: (data: TransferStructure) => void;
	reject: (error: any) => void;
}

const checkedGtins = new Set<string>([]);
const goodGtins = new Set<string>([]);
const badGtins = new Map<string, unknown>([]);

const keyOrder: Array<keyof Omit<MandateProps<NonNullable<AttributeGenericMaterialFashion>, keyof AttributeGenericMaterialFashion>, 'undefined'>> = [
	'materialCompositionPerLocation',
	'materialComposition',
	'materialCompositionAsText',
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fixGtin(article: Article): Article | undefined | never {
	const attr = article?.articleAttributes?.attributeGenericMaterialFashion;
	if (attr == null) return;

	const keys = Object.keys(attr);
	if (keys.length === 0) throw new Error('Article has no property set in attributeGenericMaterialFashion');
	if (keys.length === 1) return;

	const newKeys = keyOrder.filter((k) => keys.includes(k));

	const toRemove = newKeys.splice(1, newKeys.length);

	toRemove.forEach((k) => {
		// attr[k] = null;
		delete attr[k];
	});

	return article;
}

const queue = async.queue((task: Task, cbQueue) => {
	// console.time(task.gtin);
	console.log(`Current Progress: ${checkedGtins.size}/${gtins.length}`);
	// console.log(`Got task with GTIN: ${task.gtin}`);

	if (checkedGtins.has(task.gtin)) {
		console.log('Duplicate GTIN: ', task.gtin);

		task.reject(new Error('Duplicate GTIN'));
		return void cbQueue(null);
	}

	// const handlerErr = (err: unknown) => {
	// 	// console.timeEnd(task.gtin);
	// 	console.error('Error occured: ', err);
	// 	checkedGtins.add(task.gtin);

	// 	task.reject(err);
	// 	cbQueue(null);
	// };

	async.autoInject(
		{
			getGtin: (cb: AsyncResultCallback<string>) => cb(null, task.gtin),
			fetchArticle: (getGtin: string, cb: AsyncResultCallback<Article>) =>
				void getArticleFromPL(getGtin, EChannels.DDM).then(
					(res) => {
						goodGtins.add(task.gtin);
						return cb(null, res);
					},
					(err) => {
						if (err instanceof MalformedThingError) {
							badGtins.set(task.gtin, err.humanReadableErrors);
						} else {
							badGtins.set(task.gtin, err);
						}
						return cb(err);
					},
				),
			validateArticle: (fetchArticle: TransferStructure, cb: AsyncResultCallback<void>) => {
				try {
					const article = fetchArticle.article;
					const attr = article?.articleAttributes?.attributeGenericMaterialFashion;
					if (attr == null) return cb(null);

					const keys = Object.keys(attr);
					if (keys.length === 0) throw new Error('Missing at least one property in attributeGenericMaterialFashion');
					if (keys.length > 1) {
						const err = new Error(`Article has multiple properties in attributeGenericMaterialFashion: ${keys.join(', ')}`);
						badGtins.set(task.gtin, err);
					}
					cb(null);
				} catch (e) {
					cb(e);
				}
			},
			// correctAttr: (fetchArticle: TransferStructure, cb: AsyncResultCallback<Article | void>) => {
			// 	try {
			// 		const article = fetchArticle.article;
			// 		if (article == null) throw new Error('Missing article');

			// 		const res = fixGtin(article);

			// 		cb(null, res);
			// 	} catch (e) {
			// 		cb(e);
			// 	}
			// },
			// patchArticle: (correctAttr: Article | void, cb: AsyncResultCallback<void>) => {
			// 	if (correctAttr == null) return cb(null);

			// 	delete correctAttr.history;
			// 	delete correctAttr.quality;
			// 	/// @ts-expect-error // maybe this is present
			// 	delete correctAttr.statusCode;

			// 	if (correctAttr.lifecycle) {
			// 		correctAttr.lifecycle.status = 'Article.Active.110.Classification';
			// 	}

			// 	// api.post('/article', {
			// 	// 	body: JSON.stringify({
			// 	// 		articles: [correctAttr],
			// 	// 	}),
			// 	// }).then(
			// 	// 	(res) => {
			// 	// 		console.log(res);
			// 	// 		debugger;
			// 	// 	},
			// 	// 	(err) => {
			// 	// 		debugger;
			// 	// 		cb(err);
			// 	// 	},
			// 	// );

			// 	cb(null);
			// },
		},
		(err, results) => {
			checkedGtins.add(task.gtin);
			// if (err) {
			// 	debugger;
			// 	return void handlerErr(err);
			// }
			// // console.timeEnd(task.gtin);

			task.resolve(results);
			cbQueue(null);
		},
	);
}, 500);

async function analyze(listGtins: string[]) {
	console.log('GTINS: ', listGtins);
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

	await Promise.allSettled(promises);
}

const fields = [
	'gtin',
	'valid',
	'Num Errors',
	'Error 1',
	// 'Error 2',
	// 'Error 3',
	// 'Error 4',
	// 'Error 5',
	// 'Error 6',
	// 'Error 7',
	// 'Error 8',
	// 'Error 9',
	// 'Error 10',
];
const parser = new Parser({ fields: fields });

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
CFonts.say('Mega Multi|Model-Manipulator|Maximum', {
	font: 'block', // define the font face
	align: 'center', // define text alignment
	colors: ['red', 'blue'], // define all colors
	background: 'transparent', // define the background color, you can also use `backgroundColor` here as key
	letterSpacing: 1, // define letter spacing
	lineHeight: 2, // define the line height
	space: true, // define if the output text should have empty lines on top and on the bottom
	maxLength: '20', // define how many character can be on one line
	gradient: ['red', 'blue'], // define your two gradient colors
	independentGradient: false, // define if you want to recalculate the gradient for each new line
	transitionGradient: false, // define if this is a transition between colors directly
	env: 'node', // define the environment CFonts is being executed in
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
CFonts.say('Mastermode Started', {
	font: 'shade', // define the font face
	align: 'center', // define text alignment
	colors: ['#f18f01', '#2e4057'], // define all colors
	background: 'transparent', // define the background color, you can also use `backgroundColor` here as key
	letterSpacing: 1, // define letter spacing
	lineHeight: 1, // define the line height
	space: true, // define if the output text should have empty lines on top and on the bottom
	maxLength: '99', // define how many character can be on one line
	gradient: false, // define your two gradient colors
	independentGradient: false, // define if you want to recalculate the gradient for each new line
	transitionGradient: false, // define if this is a transition between colors directly
	env: 'node', // define the environment CFonts is being executed in
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,  @typescript-eslint/no-unsafe-call
CFonts.say('Made with Love in|IT-Village Lintfort', {
	font: 'tiny', // define the font face
	align: 'center', // define text alignment
	colors: ['#99C24D'], // define all colors
	background: 'transparent', // define the background color, you can also use `backgroundColor` here as key
	letterSpacing: 1, // define letter spacing
	lineHeight: 1, // define the line height
	space: true, // define if the output text should have empty lines on top and on the bottom
	maxLength: '20', // define how many character can be on one line
	gradient: false, // define your two gradient colors
	independentGradient: false, // define if you want to recalculate the gradient for each new line
	transitionGradient: false, // define if this is a transition between colors directly
	env: 'node', // define the environment CFonts is being executed in
});

// eslint-disable-next-line @typescript-eslint/naming-convention
interface IData {
	gtin: string;
	valid: boolean;
	'Num Errors': number;
	'Error 1'?: unknown;
	'Error 2'?: unknown;
	'Error 3'?: unknown;
	'Error 4'?: unknown;
	'Error 5'?: unknown;
	'Error 6'?: unknown;
	'Error 7'?: unknown;
	'Error 8'?: unknown;
	'Error 9'?: unknown;
	'Error 10'?: unknown;
}

async function analyzeAndWrite(listGtins: string[]) {
	await analyze(listGtins).then(() => {
		const data: IData[] = [];

		console.log(`Analyzed ${listGtins.length} GTINs`);
		console.log(`Good: ${goodGtins.size}`);
		console.log(`Bad: ${badGtins.size}`);

		// goodGtins.forEach((gtin) => {
		// 	data.push({
		// 		gtin: gtin,
		// 		valid: true,
		// 		'Num Errors': 0,
		// 	});
		// });

		Array.from(badGtins.entries()).forEach((curData) => {
			const err = curData[1];

			data.push({
				gtin: curData[0],
				valid: false,
				'Num Errors': Array.isArray(err) ? err.length : 1,
				/* eslint-disable @typescript-eslint/no-unsafe-assignment */
				'Error 1': Array.isArray(err) ? err[0] : err,
				'Error 2': Array.isArray(err) ? err[1] : undefined,
				'Error 3': Array.isArray(err) ? err[2] : undefined,
				'Error 4': Array.isArray(err) ? err[3] : undefined,
				'Error 5': Array.isArray(err) ? err[4] : undefined,
				'Error 6': Array.isArray(err) ? err[5] : undefined,
				'Error 7': Array.isArray(err) ? err[6] : undefined,
				'Error 8': Array.isArray(err) ? err[7] : undefined,
				'Error 9': Array.isArray(err) ? err[8] : undefined,
				'Error 10': Array.isArray(err) ? err[9] : undefined,
				/* eslint-enable @typescript-eslint/no-unsafe-assignment */
			});
		});

		data.forEach((row) => {
			const keys = Object.keys(row);

			keys.forEach((k) => {
				/// @ts-expect-error // meh
				if (row[k] instanceof Error) {
					/// @ts-expect-error // meh
					// eslint-disable-next-line max-len
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
					row[k] = row[k].toString();
				}
			});
		});

		const csv = parser.parse(data);
		const filePath = path.resolve(__dirname, `GTIN-Check-PROD-${new Date().toISOString()}.csv`);

		fs.writeFileSync(filePath, csv);
		console.log('Written csv to ', filePath);
	}, console.error);
}

const batchSize = 10_000;
async function analyzeBatch(listGtins: string[]) {
	const chunks = splitArrayToChunks(listGtins, batchSize);
	const index = 0;
	for (const chunk of chunks) {
		console.log(`Analyzing GTINs ${index * batchSize}-${(index + 1) * batchSize} of ${listGtins.length}`);
		await analyzeAndWrite(chunk);
	}
}

void analyzeBatch(gtins).then(console.log, console.error);
