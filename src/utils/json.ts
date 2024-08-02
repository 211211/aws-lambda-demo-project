/**
 * Safely parse a string to JSON object
 *
 * @returns parsed object if input string is an valid JSON string
 * @returns null if input string isn't an valid JSON string
 */
export function safelyParseJSON(input: string): unknown {
	try {
		return JSON.parse(input);
	} catch (e) {
		return null;
	}
}
