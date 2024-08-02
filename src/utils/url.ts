import { URL } from 'url';
import { isHttpsUri, isHttpUri } from 'valid-url';

export function isValidUrl(url: unknown): boolean {
	if (typeof url !== 'string') return false;
	const httpsValidationResult = isHttpsUri(url);
	const httpValidationResult = isHttpUri(url);
	return typeof httpsValidationResult !== 'undefined' || typeof httpValidationResult !== 'undefined';
}
export function isValidHttpsUrl(url: string): boolean {
	try {
		// Parse and check the protocol
		const parsedUrl = new URL(url);
		if (parsedUrl.protocol.toLowerCase() !== 'https:') return false;

		// Validate the entire things
		const httpsValidationResult = isHttpsUri(url);
		return typeof httpsValidationResult !== 'undefined';
	} catch (e) {
		return false;
	}
}
