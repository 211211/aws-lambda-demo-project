import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { isLeft } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';

import { config } from '../../config';
import { InvalidParameterValueError, ValidationError } from '../../errors';
import { Brand } from '../../tables/workbench/assignments';
import { getDbClient } from '../../utils/dbClient';
import { findSingleRecordByKey, putBatchItemsToTable } from './genericDbQueries';
import { findSizeMappingsByBrand } from './sizeMappingRepo';

export const tableBrands = `${config.stackName}-brands` as const;
const { documentClient } = getDbClient();

export async function putBrandItem(brandItem: Brand): Promise<string> {
	await putBatchItemsToTable(tableBrands, [brandItem]);
	return brandItem.brand;
}

/**
 * Delete a single brand
 * This will fail if there is at least one SizeMapping with this brand.
 */
export async function deleteBrand(brand: string): Promise<void> {
	// Check if any SizeMapping use this brand
	const sizeMappings = await findSizeMappingsByBrand(brand);
	if (sizeMappings.length > 0) throw new InvalidParameterValueError('At least one SizeMapping with this brand', 409);
	// Delete the target brand
	const params: DocumentClient.DeleteItemInput = {
		TableName: tableBrands,
		Key: {
			brand: brand,
		},
	};
	await documentClient.delete(params).promise();
}

/**
 * Find a single brand by brand name
 * This will fail if brand is not found.
 */
export async function findSingleBrand(brand: string): Promise<Brand | undefined> {
	return findSingleRecordByKey(
		tableBrands,
		{
			brand: brand,
		},
		Brand,
	);
}

/**
 * Validate single brand from CSV (brand and brand name)
 * It with throw error if data is empty or not in correct type
 */
export function validateSingleBrandInCsv(brand: string, brandName: string, row: string[]): Brand {
	if (brand.length === 0) throw new ValidationError('Invalid brand data', [`Empty Marke ${JSON.stringify({ row: row })}`]);
	if (brandName.length === 0) throw new ValidationError('Invalid brand data', [`Empty Markenbez  ${JSON.stringify({ row: row })}`]);
	const brandValidator = Brand.decode({
		brand: brand,
		brandName: brandName,
	});
	if (isLeft(brandValidator)) throw new ValidationError('Invalid brand data', PathReporter.report(brandValidator));
	return brandValidator.right;
}
