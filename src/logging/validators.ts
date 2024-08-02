/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import * as t from 'io-ts';
import { date, DateFromISOString, NonEmptyString } from 'io-ts-types';

import { musterAnforderungRequest, ReplyFromSAP } from '../communication/SAP/dtos';
import { anyDesc } from '../DataStructure/decision';
import { ParsedVvbData } from '../DataStructure/vvb';
import { Price } from '../lib/api-productlake';
import { SingleExpiredImage } from '../tables/workbench/assignments';
import { isoTimestampString } from '../validation/Date';
import { fromEnum } from '../validation/Enum';
import { typeGtin } from '../validation/gtin';

// eslint-disable-next-line no-shadow
export enum InipStatus {
	/**
	 * Logs the Execution with decision result
	 */
	LOG_EXECUTION = 'LOG_EXECUTION',

	/**
	 * No specific status.
	 *
	 * The System may process this grouped Product like normal.
	 */
	CLEAR = 'CLEAR',

	/**
	 * The User needs to deceide.
	 *
	 * (This happens when there is a BS-Lock and vvB).
	 *
	 * The System may re-check this article and update the status if something changes.
	 */
	ASK_USER = 'ASK_USER',

	/**
	 * The User has deceided.
	 *
	 * The System should process according to the user-decision.
	 */
	ASK_USER_COMPLETE = 'ASK_USER_COMPLETE',

	/**
	 * All 3 FMA-Requests were rejected.
	 *
	 * TODO: what should be done in this case?
	 */
	FMA_REJECTED = 'FMA_REJECTED',

	/**
	 * Photo-Sample request sent to SAP
	 */
	FMA_REQUEST_SENT = 'FMA_REQUEST_SENT',

	/**
	 * Photo-Sample response from SAP
	 */
	FMA_RESPONSE_RECEIVED = 'FMA_RESPONSE_RECEIVED',

	/**
	 * The FMA that have to be created manually
	 */
	FMA_STORE_NEW = 'FMA_STORE::NEW',

	/**
	 * The FMA that has been decided picked
	 */
	FMA_STORE_PICKED = 'FMA_STORE::PICKED',

	/**
	 * The FMA that has been decided packed
	 */
	FMA_STORE_PACKED = 'FMA_STORE::PACKED',

	/**
	 * The FMA that has been decided not available
	 */
	FMA_STORE_NOT_AVAILABLE = 'FMA_STORE::NOT_AVAILABLE',

	/**
	 * The HQ FMA that have to be created manually
	 */
	MANUAL_HQ_FMA_NEW = 'MANUAL_HQ_FMA::NEW',

	/**
	 * The HQ FMA that has been decided packed
	 */
	MANUAL_HQ_FMA_PACKED = 'MANUAL_HQ_FMA::PACKED',

	/**
	 * The HQ FMA that has been removed from package
	 */
	MANUAL_HQ_FMA_REMOVED = 'MANUAL_HQ_FMA::REMOVED',

	/**
	 * The article of the target FMA just arrived to the PhotoStudio
	 */
	FMA_PHOTOSTUDIO_RECEIPT_INPUT = 'FMA_PHOTOSTUDIO_RECEIPT::INPUT',

	/**
	 * The article of the target FMA just left to the PhotoStudio
	 */
	FMA_PHOTOSTUDIO_RECEIPT_OUTPUT = 'FMA_PHOTOSTUDIO_RECEIPT::OUTPUT',
}
// eslint-disable-next-line @typescript-eslint/naming-convention
export const InipStatusValidator = fromEnum('InipStatus', InipStatus);

// eslint-disable-next-line no-shadow
export enum askUserDecision {
	CREATE_FMA = 'CREATE_FMA',
	IGNORE = 'IGNORE',
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const askUserDecisionValidator = fromEnum('askUserDecision', askUserDecision);

/**
 * All InipStatus-States which are blocking.
 *
 * The System should not re-check these articles/products.
 */
export const blockingStates = [
	InipStatus.FMA_REQUEST_SENT,
	InipStatus.FMA_RESPONSE_RECEIVED,
	InipStatus.FMA_REJECTED,
	InipStatus.FMA_STORE_NEW,
	InipStatus.FMA_STORE_PICKED,
	InipStatus.FMA_STORE_PACKED,
	InipStatus.MANUAL_HQ_FMA_NEW,
	InipStatus.MANUAL_HQ_FMA_PACKED,
];

const commonFields = {
	/**
	 * The Identifier for each grouped Product.
	 *
	 * This is also used as PrimaryKey
	 */
	identifier: t.string,
	/**
	 * The ExecutionId from the StepFunctionsContextObject
	 */
	executionId: t.string,
	/**
	 * Last time the Grouped Product was checked by the system
	 */
	timestamp: isoTimestampString,
	status: InipStatusValidator,
};

export const GroupedProductState_LOG_EXECUTION = t.type({
	...commonFields,
	status: t.literal(InipStatus.LOG_EXECUTION),
	gtinsInProduct: t.array(typeGtin),
	decision: anyDesc,
	productTitle: t.union([t.string, t.undefined, t.null]),
	nearestValidExpiry: t.union([DateFromISOString, date, t.undefined, t.null]),
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GroupedProductState_LOG_EXECUTION = t.TypeOf<typeof GroupedProductState_LOG_EXECUTION>;

export const GroupedProductState_CLEAR = t.type({
	...commonFields,
	status: t.literal(InipStatus.CLEAR),
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GroupedProductState_CLEAR = t.TypeOf<typeof GroupedProductState_CLEAR>;

const askUserCommonFields = {
	...commonFields,
	vvb: ParsedVvbData,

	affectedGtins: t.array(t.string),
};

export const GroupedProductState_ASK_USER = t.type({
	...askUserCommonFields,

	status: t.literal(InipStatus.ASK_USER),

	consumptionTheme: t.number,
	brand: t.string,
	stock: t.number,
	images: t.array(SingleExpiredImage),
	gtinsHaveExpiredImages: t.array(t.string),
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GroupedProductState_ASK_USER = t.TypeOf<typeof GroupedProductState_ASK_USER>;

export const GroupedProductState_ASK_USER_COMPLETE = t.type({
	...askUserCommonFields,

	status: t.literal(InipStatus.ASK_USER_COMPLETE),
	decision: askUserDecisionValidator,
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GroupedProductState_ASK_USER_COMPLETE = t.TypeOf<typeof GroupedProductState_ASK_USER_COMPLETE>;

/**
 * Fields shared by all FMA States
 */
const commonFmaFields = {
	// /**
	//  * The ID of the currently running FMA-Request.
	//  */
	// openFmaId: t.undefined,
	// /**
	//  * Array with up to 3 FMA-Requests and their responses
	//  */
	// fmaData: t.array(fmaRequestResponseCombo),

	...commonFields,
	fmaRequestId: t.string,
	gtin: typeGtin,
	productTitle: t.string,
	destinationLocationId: t.string,
	procurementStartedAt: t.union([DateFromISOString, date]),
};

export const GroupedProductState_FMA_REJECTED = t.type({
	...commonFmaFields,
	// ...commonFields,
	status: t.literal(InipStatus.FMA_REJECTED),
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GroupedProductState_FMA_REJECTED = t.TypeOf<typeof GroupedProductState_FMA_REJECTED>;

export const GroupedProductState_FMA_REQUEST_SENT = t.type({
	...commonFmaFields,
	status: t.literal(InipStatus.FMA_REQUEST_SENT),
	requestPayload: musterAnforderungRequest,
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GroupedProductState_FMA_REQUEST_SENT = t.TypeOf<typeof GroupedProductState_FMA_REQUEST_SENT>;

export const GroupedProductState_FMA_RESPONSE_RECEIVED = t.type({
	...commonFmaFields,
	status: t.literal(InipStatus.FMA_RESPONSE_RECEIVED),
	responsePayload: ReplyFromSAP,
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GroupedProductState_FMA_RESPONSE_RECEIVED = t.TypeOf<typeof GroupedProductState_FMA_RESPONSE_RECEIVED>;

// eslint-disable-next-line no-shadow
export enum PickingState {
	NEW = 'NEW',
	PICKED = 'PICKED',
	NOT_AVAILABLE = 'NOT_AVAILABLE',
	PACKED = 'PACKED',
}

export const FmaStoreStatusPrefix = 'FMA_STORE::' as const;
export const GroupedProductState_FMA_STORE = t.type({
	...commonFields,
	status: t.union([
		t.literal(InipStatus.FMA_STORE_NEW),
		t.literal(InipStatus.FMA_STORE_PICKED),
		t.literal(InipStatus.FMA_STORE_PACKED),
		t.literal(InipStatus.FMA_STORE_NOT_AVAILABLE),
	]),
	fmaRequestId: t.string,
	gtin: typeGtin,
	storeId: t.string,
	destinationLocationId: t.string,
	title: t.string,
	size: t.union([t.string, t.null]),
	color: t.union([t.string, t.null]),
	consumptionTheme: t.number,
	comment: t.string,
	brand: t.string,
	prices: t.array(Price),
	availableAmount: t.number,
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GroupedProductState_FMA_STORE = t.TypeOf<typeof GroupedProductState_FMA_STORE>;

// eslint-disable-next-line no-shadow
export enum HqPickingState {
	NEW = 'NEW',
	PACKED = 'PACKED',
}

const manualHqFmaCommonFields = {
	...commonFields,
	status: InipStatus,
	gtin: typeGtin,
	destinationLocationId: t.string,
	title: t.string,
	size: t.union([t.string, t.null]),
	color: t.union([t.string, t.null]),
	consumptionTheme: t.number,
	brand: t.string,
};

export const GroupedProductState_MANUAL_HQ_FMA_NEW = t.type({
	...manualHqFmaCommonFields,
	status: t.literal(InipStatus.MANUAL_HQ_FMA_NEW),
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GroupedProductState_MANUAL_HQ_FMA_NEW = t.TypeOf<typeof GroupedProductState_MANUAL_HQ_FMA_NEW>;

export const GroupedProductState_MANUAL_HQ_FMA_PACKED = t.type({
	...manualHqFmaCommonFields,
	status: t.literal(InipStatus.MANUAL_HQ_FMA_PACKED),
	fmaRequestId: NonEmptyString,
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GroupedProductState_MANUAL_HQ_FMA_PACKED = t.TypeOf<typeof GroupedProductState_MANUAL_HQ_FMA_PACKED>;

export const GroupedProductState_MANUAL_HQ_FMA_REMOVED = t.type({
	...manualHqFmaCommonFields,
	status: t.literal(InipStatus.MANUAL_HQ_FMA_REMOVED),
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GroupedProductState_MANUAL_HQ_FMA_REMOVED = t.TypeOf<typeof GroupedProductState_MANUAL_HQ_FMA_REMOVED>;

export const GroupedProductState_MANUAL_HQ_FMA = t.union([
	GroupedProductState_MANUAL_HQ_FMA_NEW,
	GroupedProductState_MANUAL_HQ_FMA_PACKED,
	GroupedProductState_MANUAL_HQ_FMA_REMOVED,
]);
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GroupedProductState_MANUAL_HQ_FMA = t.TypeOf<typeof GroupedProductState_MANUAL_HQ_FMA>;

const photoStudioReceiptCommonFields = {
	...commonFields,
	fmaRequestId: NonEmptyString,
	destinationLocationId: NonEmptyString,
	gtin: typeGtin,
};

export const GroupedProductState_PHOTOSTUDIO_RECEIPT_INPUT = t.type({
	...photoStudioReceiptCommonFields,
	status: t.literal(InipStatus.FMA_PHOTOSTUDIO_RECEIPT_INPUT),
	weScanTimestamp: t.union([DateFromISOString, date]),
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GroupedProductState_PHOTOSTUDIO_RECEIPT_INPUT = t.TypeOf<typeof GroupedProductState_PHOTOSTUDIO_RECEIPT_INPUT>;

export const GroupedProductState_PHOTOSTUDIO_RECEIPT_OUTPUT = t.type({
	...photoStudioReceiptCommonFields,
	status: t.literal(InipStatus.FMA_PHOTOSTUDIO_RECEIPT_OUTPUT),
	waScanTimestamp: t.union([DateFromISOString, date]),
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GroupedProductState_PHOTOSTUDIO_RECEIPT_OUTPUT = t.TypeOf<typeof GroupedProductState_PHOTOSTUDIO_RECEIPT_OUTPUT>;

export const GroupedProductState = t.union([
	GroupedProductState_LOG_EXECUTION,
	GroupedProductState_CLEAR,
	GroupedProductState_ASK_USER,
	GroupedProductState_ASK_USER_COMPLETE,
	GroupedProductState_FMA_REJECTED,
	GroupedProductState_FMA_REQUEST_SENT,
	GroupedProductState_FMA_RESPONSE_RECEIVED,
	GroupedProductState_MANUAL_HQ_FMA_NEW,
	GroupedProductState_MANUAL_HQ_FMA_PACKED,
	GroupedProductState_MANUAL_HQ_FMA_REMOVED,
	GroupedProductState_FMA_STORE,
	GroupedProductState_PHOTOSTUDIO_RECEIPT_INPUT,
	GroupedProductState_PHOTOSTUDIO_RECEIPT_OUTPUT,
]);
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GroupedProductState = t.TypeOf<typeof GroupedProductState>;

export const GroupedProductValidators: { [k in InipStatus]: t.TypeC<any> } = {
	LOG_EXECUTION: GroupedProductState_LOG_EXECUTION,
	ASK_USER: GroupedProductState_ASK_USER,
	ASK_USER_COMPLETE: GroupedProductState_ASK_USER_COMPLETE,
	CLEAR: GroupedProductState_CLEAR,
	FMA_REJECTED: GroupedProductState_FMA_REJECTED,
	FMA_REQUEST_SENT: GroupedProductState_FMA_REQUEST_SENT,
	FMA_RESPONSE_RECEIVED: GroupedProductState_FMA_RESPONSE_RECEIVED,
	'MANUAL_HQ_FMA::NEW': GroupedProductState_MANUAL_HQ_FMA_NEW,
	'MANUAL_HQ_FMA::PACKED': GroupedProductState_MANUAL_HQ_FMA_PACKED,
	'MANUAL_HQ_FMA::REMOVED': GroupedProductState_MANUAL_HQ_FMA_REMOVED,
	'FMA_STORE::NEW': GroupedProductState_FMA_STORE,
	'FMA_STORE::PICKED': GroupedProductState_FMA_STORE,
	'FMA_STORE::PACKED': GroupedProductState_FMA_STORE,
	'FMA_STORE::NOT_AVAILABLE': GroupedProductState_FMA_STORE,
	'FMA_PHOTOSTUDIO_RECEIPT::INPUT': GroupedProductState_PHOTOSTUDIO_RECEIPT_INPUT,
	'FMA_PHOTOSTUDIO_RECEIPT::OUTPUT': GroupedProductState_PHOTOSTUDIO_RECEIPT_OUTPUT,
};
