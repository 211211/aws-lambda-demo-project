/* eslint-disable camelcase */
export abstract class InipError extends Error {
	public static readonly code: number = -1;
	public statusCode = 500;
	public name: string;

	public constructor(message: string, statusCode?: number) {
		super(message);

		/// @ts-expect-error // __proto__ will be there.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		this.name = this.__proto__?.constructor?.name;

		if (statusCode != null) {
			if (typeof statusCode !== 'number' || Number.isNaN(statusCode)) {
				throw new Error(`Invalid statusCode ${statusCode}`);
			}
			this.statusCode = statusCode;
		}
	}
}

/**
 * This is the Definition of Error-Codes.
 *
 * YOU SHOULD NEVER CHANGE OR DELETE AN EXISING CODE, ONLY ADD ERROR CODES!
 */
// eslint-disable-next-line no-shadow
export enum InipErrorCodes {
	// 1xxxx - Errors used in the communication with the outside.
	ERR_InvalidAPIResponse = 10001,
	ERR_MalformedAPIResponse = 10002,
	ERR_MalformedAPIRequest = 10003,
	ERR_ValidationError = 10004,
	ERR_DbResultNotFound = 10005,
	ERR_OutdatedWaitingTaskToken = 10006,
	ERR_InvalidMessage = 10010,

	ERR_MalformedInput = 100100,

	// 102xx Product-Lake Stuff
	ERR_ArticleNotFound = 10201,
	ERR_InconsistentProduct = 10202,

	// 101xxx - Sizemapping & PhotoStudio Assignment Errors
	ERR_SizeMappingGeneral = 101000, // General Error
	ERR_SizemappingNoMatch = 101001,
	ERR_SizeMappingKtNotAllowed = 101002,
	ERR_SizemappingKtBrandNotAllowed = 101003,

	// 1011xx - Some action by the User is required
	ERR_SizemappingMissing = 101101,
	ERR_PhotoStudioAssignmentMissing = 101102,
	ERR_NoSizeMappingIntersection = 101103,
	ERR_MissingBrand = 101104,
	ERR_MissingSector = 101105,

	// 2xxxx Errors which are created in the application because of some missasumption which passed initial validation.
	// This can also indicate a programming error.
	ERR_InvalidParameterValue = 20001,

	// 5xxxx Stuff which went wrong with Dynamo DB
	ERR_InvalidDynamoDbResult = 50001,
	ERR_MalformedDynamoDbResult = 50002,

	// 9xxxx Errors regarding the general application.
	// This usually means something is totally wrong and needs to be fixed, for example a misconfiguration of the ENV.
	ERR_InvalidConfiguration = 90001,
	ERR_InvalidExecutingEnvironment = 90002,
}
