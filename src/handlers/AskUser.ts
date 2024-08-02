import 'source-map-support/register';

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { isLeft } from 'fp-ts/lib/These';
import { PathReporter } from 'io-ts/lib/PathReporter';

import { getLastNonLogStateForIdentifier, insertNewState } from '../communication/DB/stateRepo';
import { ExecutionData, GroupedProduct, ParsedImageValidity, ParsedVvbData, TransferStructure } from '../DataStructure';
import { DbResultNotFoundError, InvalidParameterValueError, MalformedInputError, ValidationError } from '../errors';
import { askUserDecision, GroupedProductState_ASK_USER, GroupedProductState_ASK_USER_COMPLETE, InipStatus } from '../logging/validators';
import { getSizemappingSelector } from '../processing/Size';
import { AskUserCompleteData } from '../tables/workbench/assignments';
import { outputError, returnResult } from '../utils/ApiGatewayUtils';
import { getDateYYYYMMDD } from '../utils/date';
import { safelyParseJSON } from '../utils/json';
import { dateToIsoTimestampString } from '../validation/Date';

export async function handler(input: TransferStructure): Promise<TransferStructure> {
	try {
		// Validate required values
		const { groupIdentifier, vvb, product, media } = input;
		if (groupIdentifier == null) throw new InvalidParameterValueError('groupIdentifier is required');

		const validationVvb = ParsedVvbData.decode(vvb);
		if (isLeft(validationVvb)) throw new MalformedInputError('Missing or malformed vvb received', validationVvb);
		if (validationVvb.right.sum < 1) throw new ValidationError('Invalid vvb data', ['The sum value is less than 1']);

		const validationProduct = GroupedProduct.decode(product);
		if (isLeft(validationProduct)) throw new MalformedInputError('Missing or malformed Product received', validationProduct);

		const mediaValidation = ParsedImageValidity.decode(media);
		if (isLeft(mediaValidation)) throw new MalformedInputError('Malformed media received', validationProduct);

		const validationExecution = ExecutionData.decode(input.execution);
		if (isLeft(validationExecution)) throw new MalformedInputError('Invalid execution', validationExecution);

		// Add new state data
		const { brand, consumptionTheme } = getSizemappingSelector(validationProduct.right.articles);

		// Add new expired images data
		const expiredImagesData = mediaValidation.right.expiredImages;

		const state: GroupedProductState_ASK_USER = {
			status: InipStatus.ASK_USER,
			identifier: groupIdentifier,
			executionId: validationExecution.right.id,
			timestamp: dateToIsoTimestampString(new Date()),
			vvb: validationVvb.right,
			affectedGtins: validationProduct.right.articles.map((article) => article.gtin),
			brand: brand,
			consumptionTheme: consumptionTheme,
			images: expiredImagesData.map((item) => ({
				url: item.url,
				expiredDate: getDateYYYYMMDD(item.expiredDate),
			})),
			stock: validationVvb.right.sum,
			gtinsHaveExpiredImages: expiredImagesData.map((item) => item.gtin),
		};

		await insertNewState(state);

		return input;
	} catch (err) {
		return Promise.reject(err);
	}
}

/**
 * POST /askUserComplete
 */
export const updateAskUserDecision = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	try {
		if (event.body == null || event.body.length === 0) throw new ValidationError('Invalid request', ['Missing request body']);

		const askUserCompleteRequestBody = safelyParseJSON(event.body);
		if (typeof askUserCompleteRequestBody !== 'object' || askUserCompleteRequestBody == null) {
			throw new ValidationError('Invalid request', ['Invalid body']);
		}

		const requestBodyValidation = AskUserCompleteData.decode(askUserCompleteRequestBody);
		if (isLeft(requestBodyValidation)) {
			throw new ValidationError('Invalid request', PathReporter.report(requestBodyValidation));
		}

		const { identifier, takeNewPhotos } = requestBodyValidation.right;

		const lastState = await getLastNonLogStateForIdentifier(identifier);

		if (typeof lastState === 'undefined') throw new DbResultNotFoundError(`Could not found state data matching identifier ${identifier}`);

		if (lastState.status !== InipStatus.ASK_USER)
			throw new ValidationError('Invalid request', ['The ASK_USER state was changed, can not make any further decision'], 410);

		const newState: GroupedProductState_ASK_USER_COMPLETE = {
			identifier: lastState.identifier,
			executionId: event.requestContext?.extendedRequestId ?? 'POST /askUserComplete',
			vvb: lastState.vvb,
			affectedGtins: lastState.affectedGtins,
			decision: takeNewPhotos === true ? askUserDecision.CREATE_FMA : askUserDecision.IGNORE,
			status: InipStatus.ASK_USER_COMPLETE,
			timestamp: dateToIsoTimestampString(new Date()),
		};
		await insertNewState(newState);

		return returnResult(200, 'Success');
	} catch (e) {
		return outputError(e);
	}
};
