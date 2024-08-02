import { InvalidParameterValueError } from '../errors';

/**
 * Split array to chunks by max length
 */
export function splitArrayToChunks<T>(array: T[], maximum = 1): T[][] {
	if (maximum < 1) throw new InvalidParameterValueError('Invalid maximum value, should be >= 1');
	if (typeof array === 'undefined' || array === null || array.length === 0) throw new InvalidParameterValueError('Undefined or empty array');

	const splittedRequestArray = [];
	let i;
	let j;
	for (i = 0, j = array.length; i < j; i += maximum) {
		splittedRequestArray.push(array.slice(i, i + maximum));
	}
	return splittedRequestArray;
}
