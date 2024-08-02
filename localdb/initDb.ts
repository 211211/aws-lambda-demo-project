import path from 'path';
import { readFile, readdir } from 'fs/promises';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { initKtAssignmentData } from '../src/handlers/KtAssignmentHandlers';
import { initSizeMappingData } from '../src/handlers/SizeMappingHandlers';
import { getAllRecords } from '../src/communication/DB/genericDbQueries';
import { tablePhotoAssignments } from '../src/communication/DB/ktAssignmentRepo';
import { PhotoStudioAssignments, SizeMapping } from '../src/tables/workbench/assignments';
import { tableSizeMappings } from '../src/communication/DB/sizeMappingRepo';

void (async () => {
	// Init KfBrandKtMapping
	await callDataImporter('KfBrandKtMapping', initKtAssignmentData);

	const photoAssignments = await getAllRecords(tablePhotoAssignments, PhotoStudioAssignments);
	console.log('PhotoStudioAssignments count', photoAssignments.length);

	// Init sizeMapping
	await callDataImporter('SizeMapping', initSizeMappingData);

	const sizeMappings = await getAllRecords(tableSizeMappings, SizeMapping);
	console.log('sizeMappings count', sizeMappings.length);
})();

async function callDataImporter(folderPath: string, handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>) {
	const files = await readdir(path.resolve(__dirname, '../__tests__/data/', folderPath));
	for (const file of files) {
		console.log(`Start importing ${file}`);
		const data = await readFile(path.resolve(__dirname, '../__tests__/data/', folderPath, file));

		/// @ts-expect-error Just mimic the APIGatewayProxyEvent (only body, omit other props)
		await handler({
			body: data.toString(),
		});
		console.log(`Finish importing ${file}`);
	}
}
