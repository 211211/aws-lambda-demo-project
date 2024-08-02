import { isLeft, isRight } from 'fp-ts/lib/Either';

import { getAllBrands, getSingleBrand, putSingleBrand, deleteSingleBrand } from '../../../../src/handlers/BrandHandlers';
import { getSingleSizeMapping } from '../../../../src/handlers/SizeMappingHandlers';
import { Brand, SizeMappingSelector } from '../../../../src/tables/workbench/assignments';
import { safelyParseJSON } from '../../../../src/utils/json';
import { apiTimeout } from '../../../utils/helpers';

describe('Test the brand handlers', () => {
	describe('Test the GET /brands API', () => {
		it(
			'It should return all available brands in DB',
			async () => {
				const response = await getAllBrands();
				expect(response.statusCode).toEqual(200);
				const parsedBody = safelyParseJSON(response.body);
				expect(Array.isArray(parsedBody)).toBeTruthy();
				if (Array.isArray(parsedBody)) {
					expect(parsedBody.map((item) => Brand.decode(item)).filter((validation) => isLeft(validation)).length).toEqual(0);
				}
			},
			apiTimeout,
		);
	});

	describe('Test the GET /brands/{brand} API', () => {
		it(
			'It should return only one requested available brand',
			async () => {
				const allBrands = safelyParseJSON((await getAllBrands()).body);
				const validation = Brand.decode(allBrands[0]);
				expect(isRight(validation)).toBeTruthy();
				if (isRight(validation)) {
					const targetBrandId = validation.right.brand;
					/// @ts-expect-error make handler accept test data
					const response = await getSingleBrand({
						pathParameters: {
							brand: targetBrandId,
						},
					});
					expect(response.statusCode).toEqual(200);
					const foundBrandValidation = Brand.decode(safelyParseJSON(response.body));
					expect(isRight(foundBrandValidation)).toBeTruthy();
					if (isRight(foundBrandValidation)) {
						expect(foundBrandValidation.right.brand).toEqual(targetBrandId);
					}
				}
			},
			apiTimeout,
		);

		it(
			'It should return HTTP code 404 when request a unknown brand',
			async () => {
				/// @ts-expect-error make handler accept test data
				const response = await getSingleBrand({
					pathParameters: {
						brand: '693254',
					},
				});
				expect(response.statusCode).toEqual(404);
			},
			apiTimeout,
		);
	});

	describe('Test the PUT /brands/{brand} API', () => {
		it(
			'An valid brand data should be inserted to DB',
			async () => {
				const testBrand: Brand = {
					brand: '999999999',
					brandName: 'TEST_BRAND',
				};
				/// @ts-expect-error make handler accept test data
				const putBrandResponse = await putSingleBrand({
					pathParameters: {
						brand: testBrand.brand,
					},
					body: JSON.stringify(testBrand),
				});
				expect(putBrandResponse.statusCode).toEqual(200);

				// Verify the added brand
				/// @ts-expect-error make handler accept test data
				const getBrandResponse = await getSingleBrand({
					pathParameters: {
						brand: testBrand.brand,
					},
				});
				expect(getBrandResponse.statusCode).toEqual(200);
				const foundBrandValidation = Brand.decode(safelyParseJSON(getBrandResponse.body));
				expect(isRight(foundBrandValidation)).toBeTruthy();
				if (isRight(foundBrandValidation)) {
					expect(
						foundBrandValidation.right.brand === testBrand.brand && foundBrandValidation.right.brandName === testBrand.brandName,
					).toBeTruthy();
				}
			},
			apiTimeout,
		);

		it(
			'Should return HTTP code 400 if brandName is null',
			async () => {
				const testBrand = {
					brand: '999999999',
				};
				/// @ts-expect-error make handler accept test data
				const putBrandResponse = await putSingleBrand({
					pathParameters: {
						brand: testBrand.brand,
					},
					body: JSON.stringify(testBrand),
				});
				expect(putBrandResponse.statusCode).toEqual(400);
			},
			apiTimeout,
		);
	});

	describe('Test the DELETE /brands/{brand} API', () => {
		it(
			'Should return HTTP code 400 when try to delete a brand that is using in a sizeMapping',
			async () => {
				// Validate the sizeMapping that already in DB
				const targetSizeMappingSelector: SizeMappingSelector = {
					consumptionTheme: 400204,
					brand: '7585',
					targetGroup: 'herren',
				};
				/// @ts-expect-error make lambda function accept test data
				const getSizeMappingResponse = await getSingleSizeMapping({
					pathParameters: {
						consumptionTheme: targetSizeMappingSelector.consumptionTheme.toString(),
						brand: targetSizeMappingSelector.brand,
						targetGroup: targetSizeMappingSelector.targetGroup,
					},
				});
				expect(getSizeMappingResponse.statusCode).toEqual(200);
				expect(getSizeMappingResponse.body.length).toBeGreaterThan(0);

				// Request to delete the above brand
				/// @ts-expect-error make lambda function accept test data
				const deleteBrandResponse = await deleteSingleBrand({
					pathParameters: {
						brand: targetSizeMappingSelector.brand,
					},
				});
				expect(deleteBrandResponse.statusCode).toEqual(409);
			},
			apiTimeout,
		);
	});
});
