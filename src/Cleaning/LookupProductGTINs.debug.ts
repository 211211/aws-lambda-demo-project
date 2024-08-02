import * as fs from 'fs';
import * as os from 'os';
import path from 'path';
import * as t from 'io-ts';
import AWS from 'aws-sdk';
import { DataStream, StringStream } from 'scramjet';
import csvStringify from 'csv-stringify';
import { date, DateFromISOString } from 'io-ts-types';
import { isLeft } from 'fp-ts/lib/These';

import { config } from '../config';
import { getProductSpeciale } from '../communication/ProductLake';
import { MalformedDynamoDbResultError } from '../errors';

AWS.config.update({ region: 'eu-central-1' });
const dynamoDB = new AWS.DynamoDB();

// eslint-disable-next-line prefer-const
let statement = `SELECT executionId, identifier, "timestamp", responsePayload.gtin, responsePayload.fmaRequestId FROM "${config.stackName}-state"."idx_status_timestamp" WHERE status = 'FMA_RESPONSE_RECEIVED'`;
statement += `AND responsePayload.processingStatus = 'GEP'`;
// statement += `AND "timestamp" > '2021-09-12T22:00:00.000Z'`;
// eslint-disable-next-line @typescript-eslint/naming-convention
const ResponseValidator = t.type({
	identifier: t.string,
	gtin: t.string,
	fmaRequestId: t.string,
	executionId: t.string,
	// processingStatus: t.string,
	timestamp: t.union([date, DateFromISOString]),
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
type ResponseValidator = t.TypeOf<typeof ResponseValidator>;

async function* getStream(): AsyncGenerator<ResponseValidator, void, unknown> {
	try {
		let lev: string | undefined = '';
		while (lev != null) {
			const res = await dynamoDB.executeStatement({ Statement: statement, NextToken: lev === '' ? undefined : lev }).promise();
			// the code will break without this assertion. See https://github.com/Microsoft/TypeScript/issues/26959
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
			lev = res.NextToken as undefined | string;

			if (res.Items == null) {
				throw new Error('Response is missing items');
			}

			for (const item of res.Items) {
				const entry = AWS.DynamoDB.Converter.unmarshall(item);
				const val = ResponseValidator.decode(entry);
				if (isLeft(val)) throw new MalformedDynamoDbResultError('Received malformed response', val);

				yield val.right;
			}
		}
	} catch (err) {
		console.log(err);
		throw err;
	}
}

function getFileHandle(name: string) {
	const filename = `${config.stackName}-${name}-${new Date().toISOString()}.csv`;
	const fullFile = path.resolve(__dirname, `../debug/output/${filename}`);
	return fs.createWriteStream(fullFile);
}

export function convertToCsvDate(d: Date): string {
	return d.toISOString().substr(0, 19).replace('T', ' ');
}

interface FirstStep {
	gtin: string;
	gtins: string[];
}

function testScramjet() {
	const writtenGtins = new Set<string>();
	const blockStream = new DataStream();
	const outStreamBlocks = new StringStream();
	const outFileBlocked = getFileHandle(`GTINs-BlockList`);
	outFileBlocked.write('gtin\n');

	const csvStreamer = csvStringify({
		header: true,
		delimiter: ';',
		columns: ['identifier', 'gtin', 'fmaRequestId', /* 'executionId', */ 'timestamp'],
		cast: {
			date: convertToCsvDate,
		},
	});

	const outFile = getFileHandle(`GTINs`);
	DataStream.from(getStream)
		.setOptions({
			maxParallel: os.cpus().length * 2,
		})
		.tee(blockStream)
		.pipe(csvStreamer)
		.pipe(outFile);

	blockStream
		.map(async (data: ResponseValidator): Promise<FirstStep> => {
			// getProductSpeciale no longer checking for rootGTINs
			const plSpeciale = await getProductSpeciale(data.gtin);
			return {
				gtin: data.gtin,
				gtins: plSpeciale.product.articles.map((a) => a.gtin),
			};
		})
		.catch((err: Error) => ({
			gtin: `! Error occured ${err.message}`,
			gtins: [],
		}))
		.each((item: FirstStep) => {
			outStreamBlocks.write(item.gtin);
			item.gtins.forEach((gtin) => outStreamBlocks.write(gtin));
		});

	outStreamBlocks
		.filter((gtin: string) => {
			if (writtenGtins.has(gtin)) return false;

			writtenGtins.add(gtin);
			return true;
		})
		.append('\n')
		.pipe(outFileBlocked, { end: true });
}

void testScramjet();
