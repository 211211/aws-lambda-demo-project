import { InvalidConfigurationError } from './errors';
/* eslint-disable @typescript-eslint/naming-convention */
import constants from '@stdlib/constants-time';
import { isValidUrl } from './utils/url';

function requireValidUrl(envName: string): string | undefined | never;
function requireValidUrl(envName: string, required: true): string | never;
function requireValidUrl(envName: string, required: false): string | undefined | never;
function requireValidUrl(envName: string, required = false): string | undefined | never {
	const url = process.env[envName];
	if (url == null && !required) return undefined;
	if (typeof url === 'string') {
		if (isValidUrl(url)) return url;
	}

	throw new InvalidConfigurationError(`Error parsing process.env.${envName}. Expected a valid url, got ${url}`);
}

function getInt(envName: string): number | undefined | never;
function getInt(envName: string, required: true): number | never;
function getInt(envName: string, required: false): number | undefined | never;
function getInt(envName: string, required = false): number | undefined | never {
	const thing = process.env[envName];
	if (thing == null && !required) return undefined;
	if (typeof thing === 'string') {
		const parsed = parseInt(thing, 10);
		if (Number.isSafeInteger(parsed)) return parsed;
	}

	throw new InvalidConfigurationError(`Error parsing process.env.${envName}. Expected Int, got "${thing}".`);
}

const stackName = process.env.StackName;

if (typeof stackName !== 'string') throw new Error('We require the stack name');

interface Config {
	region: string;
	stackName: string;

	endpoints: {
		productlake: string;
	};
	self: {
		endpoints: {
			notification: string | undefined;
		};
	};

	auth: {
		sap: {
			user: string;
			pass: string;
			proxyToken: string;
		};
		kore: {
			certFolder: string;
		};
	};

	logic: {
		/**
		 * All thresholds should be in ms!
		 */
		thresholds: {
			/**
			 * Min value the expiry data of an Image needs to be in the future to be considered valid.
			 *
			 * Default: 6 Weeks
			 */
			mediaValidityThreshold: number;

			/**
			 * Maximum time an execution can be sceduled into the future.
			 *
			 * AWS-Stepfunctions allows a maximum of 1 Year.
			 *
			 * Default: 28 Days
			 */
			maxSchedule: number;

			/**
			 * Maximum Time a delivery may be in the future to create an FMA.
			 *
			 * If the delivery further than this threshold, the function will reschedule another check.
			 *
			 * Default: 2 Days
			 */
			maxDeliveryInFuture: number;

			/**
			 * The time how long a Product should be blocked after a FMA was created for this product.
			 *
			 * Default: 28 Days
			 */
			blockingAfterFMA: number;
		};
	};

	axios: {
		/**
		 * Default timeout for axios
		 */
		defaultTimeout: number;

		/**
		 * Max concurrent requests per api
		 */
		maxConcurent: number;
	};

	debug?: {
		/**
		 * BY-4251 - set this to true, to ignore all media and always return invalidated media.
		 */
		ignoreMedia: boolean;
	};

	db?: {
		dbEndpoint?: string;
		enableSsl?: boolean;
		accessKeyId?: string;
		secretAccessKey?: string;
	};

	elasticsearch: {
		username: string;
		password: string;
		endpoint: string | undefined;
	};
}

function getConfigFromEnv(): Config {
	return {
		region: process.env.REGION ?? 'eu-central-1',
		stackName: process.env.StackName ?? 'INIP-UNKNOWN',
		endpoints: {
			productlake: requireValidUrl('PRODUCTLAKE_ENDPOINT', true),
		},
		self: {
			endpoints: {
				notification: requireValidUrl('NOTIFICATION_ENDPOINT'),
			},
		},

		auth: {
			sap: {
				user: 'PIM_TO_Q51',
				pass: '#21a%73?4f',
				proxyToken: 'a0fbea41cb629df4735b6d595f23e450',
			},
			kore: {
				certFolder: 'dev',
			},
		},

		axios: {
			defaultTimeout: 30_000,
			maxConcurent: getInt('MAX_NETWORK', false) ?? 50,
		},

		logic: {
			/**
			 * All thresholds should be in ms!
			 */
			thresholds: {
				/**
				 * Min value the expiry data of an Image needs to be in the future to be considered valid.
				 *
				 * Default: 6 Weeks
				 */
				mediaValidityThreshold: getInt('mediaValidityThreshold') ?? 6 * constants.MILLISECONDS_IN_WEEK,

				/**
				 * Maximum time an execution can be sceduled into the future.
				 *
				 * AWS-Stepfunctions allows a maximum of 1 Year.
				 *
				 * Default: 28 Days
				 */
				maxSchedule: getInt('maxSchedule') ?? 28 * constants.MILLISECONDS_IN_DAY,

				maxDeliveryInFuture: getInt('maxDeliveryInFuture') ?? 2 * constants.MILLISECONDS_IN_DAY,

				blockingAfterFMA: 4 * constants.MILLISECONDS_IN_WEEK,
			},
		},

		elasticsearch: {
			username: 'admin',
			password: ',Re7J]7<M3-AU*F{',
			endpoint: requireValidUrl('ELASTICSEARCH_ENDPOINT'),
		},
	};
}

const configInt: Config = {
	region: process.env.REGION ?? 'eu-central-1',
	stackName: process.env.StackName ?? 'INIP-UNKNOWN',
	endpoints: {
		productlake: 'https://int.api.productlake.galeria.de/core/',
	},
	self: {
		endpoints: {
			notification: requireValidUrl('NOTIFICATION_ENDPOINT'),
		},
	},

	auth: {
		sap: {
			user: 'PIM_TO_Q51',
			pass: '#21a%73?4f',
			proxyToken: 'a0fbea41cb629df4735b6d595f23e450',
		},
		kore: {
			certFolder: 'int',
		},
	},

	axios: {
		defaultTimeout: 30_000,
		maxConcurent: getInt('MAX_NETWORK', false) ?? 50,
	},

	logic: {
		thresholds: {
			mediaValidityThreshold: 6 * constants.MILLISECONDS_IN_WEEK,
			maxSchedule: 28 * constants.MILLISECONDS_IN_DAY,
			maxDeliveryInFuture: 14 * constants.MILLISECONDS_IN_DAY,
			blockingAfterFMA: 4 * constants.MILLISECONDS_IN_WEEK,
		},
	},

	elasticsearch: {
		username: 'admin',
		password: ',Re7J]7<M3-AU*F{',
		endpoint: requireValidUrl('ELASTICSEARCH_ENDPOINT'),
	},

	debug: {
		ignoreMedia: false,
	},
};

const configTest: Config = {
	...configInt,
	db: {
		dbEndpoint: 'http://localhost:8000',
		accessKeyId: 'DUMMY',
		secretAccessKey: 'DUMMY',
	},
	debug: undefined,

	elasticsearch: {
		username: '',
		password: '',
		endpoint: 'dummyurl',
	},
};


const configLookup: { [key: string]: Config } = {
	'INIP-DEV-QUAN': configTest,
};

let finalConfig = configLookup[stackName];
if (finalConfig == null) finalConfig = getConfigFromEnv();

export const config: Config = finalConfig;
