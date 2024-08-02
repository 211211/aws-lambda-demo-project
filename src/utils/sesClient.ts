import SES from 'aws-sdk/clients/ses';

import { config } from '../config';

let sesClient: SES | undefined;

// get ses client
export function getSesClient(): SES {
	if (typeof sesClient !== 'undefined') {
		return sesClient;
	}
	const sesConfig: SES.ClientConfiguration = {};
	// Validate the env variables
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { region } = config;

	if (region != null && region.length > 0) {
		sesConfig.region = region;
	}

	sesClient = new SES(sesConfig);
	return sesClient;
}
