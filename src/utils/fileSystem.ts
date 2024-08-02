import { readFile } from 'fs/promises';
import { isLeft } from 'fp-ts/lib/Either';
import { Json } from 'io-ts-types';

export async function readAndParseJsonFile(filePath: string): Promise<Json> {
	const fileContent = await readFile(filePath, 'utf-8');
	const parsedContent = JSON.parse(fileContent) as unknown;

	const fileValidation = Json.decode(parsedContent);
	/* istanbul ignore if */
	if (isLeft(fileValidation)) return Promise.reject(Error('Invalid json file'));
	return fileValidation.right;
}
