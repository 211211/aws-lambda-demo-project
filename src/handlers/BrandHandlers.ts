import 'source-map-support/register';

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { isLeft } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';

import { outputError, returnCustomResult, returnResult } from '../utils/ApiGatewayUtils';
import * as brandRepo from '../communication/DB/brandRepo';
import { Brand } from '../tables/workbench/assignments';
import { findSingleRecordByKey, getAllRecords } from '../communication/DB/genericDbQueries';
import { typeBrandEventWithBody, typeBrandEventWithoutBody } from '../validation/BrandEvent';

/**
 * Lambda function for the GET /brands API
 */
export const getAllBrands = async (): Promise<APIGatewayProxyResult> => {
	try {
		const brands = (await getAllRecords(brandRepo.tableBrands, Brand)) ?? [];
		return returnCustomResult(200, brands);
	} catch (e) {
		console.error(e);
		return returnResult(500, 'Internal Server Error');
	}
};

/**
 * Lambda function for the GET /brands/{brand} API
 */
export const getSingleBrand = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	try {
		// Check the availability of pathParameter
		const eventValidationResult = typeBrandEventWithoutBody.decode({
			pathParameters: event.pathParameters,
		});
		if (isLeft(eventValidationResult))
			return returnCustomResult(400, {
				errors: PathReporter.report(eventValidationResult),
				message: 'Missing path parameter',
			});

		const { brand } = eventValidationResult.right.pathParameters;
		const targetBrand = await findSingleRecordByKey(
			brandRepo.tableBrands,
			{
				brand: brand,
			},
			Brand,
		);

		if (!targetBrand) return returnResult(404, 'Not found');

		return returnCustomResult(200, targetBrand);
	} catch (e) {
		console.error(e);
		return returnResult(500, 'Internal Server Error');
	}
};

/**
 * Lambda function for the PUT /brands/{brand} API
 */
export const putSingleBrand = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	try {
		// Check the availability of pathParameter and body data
		const eventValidationResult = typeBrandEventWithBody.decode({
			pathParameters: event.pathParameters,
			body: event.body,
		});
		if (isLeft(eventValidationResult))
			return returnCustomResult(400, {
				errors: PathReporter.report(eventValidationResult),
				message: 'Missing path parameter or request body',
			});

		// Parse and validate the brand data
		const { pathParameters, body } = eventValidationResult.right;
		const { brand } = pathParameters;
		const newBrandData = JSON.parse(body) as unknown;
		if (typeof newBrandData !== 'object' || newBrandData == null) return returnResult(400, 'Invalid brand data');

		const brandDataValidationResult = Brand.decode({
			brand: brand,
			...newBrandData,
		});
		if (isLeft(brandDataValidationResult))
			return returnCustomResult(400, {
				errors: PathReporter.report(brandDataValidationResult),
				message: 'Invalid brand data',
			});

		if (brandDataValidationResult.right.brandName.length === 0)
			return returnCustomResult(400, {
				errors: ['Empty brandName'],
				message: 'Invalid brand data',
			});

		await brandRepo.putBrandItem(brandDataValidationResult.right);

		return returnResult(200, 'success');
	} catch (e) {
		console.error(e);
		return returnResult(500, 'Internal Server Error');
	}
};

/**
 * Lambda function for the DELETE /brands/{Brand} API
 */
export const deleteSingleBrand = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	try {
		// Check the availability of pathParameter
		const eventValidationResult = typeBrandEventWithoutBody.decode({
			pathParameters: event.pathParameters,
		});
		if (isLeft(eventValidationResult))
			return returnCustomResult(400, {
				errors: PathReporter.report(eventValidationResult),
				message: 'Missing path parameter',
			});

		const { brand } = eventValidationResult.right.pathParameters;
		await brandRepo.deleteBrand(brand);

		return returnResult(204, 'success');
	} catch (e) {
		return outputError(e);
	}
};
