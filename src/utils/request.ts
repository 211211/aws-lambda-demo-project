import { Readable } from 'stream';
import { parseStream } from 'fast-csv';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { InvalidParameterValueError } from '../errors';

/**
 * Get upload CSV file
 *
 * @param event request event object
 * @param hintColumnCount the expected number of column in CSV
 * @param preserveEmptyRows remove or keep the empty rows (default: false)
 * @returns rows
 */
export async function getUploadedCsvFile(event: APIGatewayProxyEvent, hintColumnCount: number, preserveEmptyRows = false): Promise<string[][]> {
	if (event.body == null || event.body.length === 0) throw new InvalidParameterValueError('Empty body');
	if (hintColumnCount < 1) throw new InvalidParameterValueError(`Invalid hintColumnCount ${hintColumnCount}`);
	const body = event.body;

	// Try to parse CSV with several delimiters
	let found = false;
	const delimiters = [',', ';'];
	const resultSet = await Promise.all(
		delimiters.map(async (delimiter) => {
			if (found) return null;

			// event.body will be a string in here
			const parsedCsv = await parseCsvContent(body, delimiter, preserveEmptyRows);
			if (parsedCsv.length === 0) return parsedCsv;
			const header = parsedCsv[0];
			if (header.length >= hintColumnCount) {
				found = true;
				return parsedCsv;
			}
			return null;
		}),
	);
	const parsedData = resultSet.find((result) => result !== null);
	return parsedData != null ? parsedData : [];
}

export async function parseCsvContent(body: string | Buffer, delimiter: string, preserveEmptyRows = false): Promise<string[][]> {
	const readableStream = Readable.from([body]);
	const parsedFile = parseStream(readableStream, {
		delimiter: delimiter,
		ignoreEmpty: !preserveEmptyRows,
	});
	return new Promise<string[][]>((resolve, reject) => {
		const data: string[][] = [];
		parsedFile
			.on('data', (chunk: string[]) => {
				data.push(chunk);
			})
			.on('end', () => {
				resolve(data);
			})
			.on('error', (e) => {
				console.error(e);
				reject(e);
			});
	});
}
