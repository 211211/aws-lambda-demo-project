import { InvalidParameterValueError } from '../errors';

/**
 * Convert target string to boolean
 *
 * @param val the target string
 * @param trueText text for the true case (default: 'true')
 * @param falseText text for the false case (default: 'false')
 * @returns true: val equal trueText
 * @returns false: val equal trueText
 * @returns undefined: val not equal both trueText and falseText
 */
export const convertStringToBoolean = (val: string, trueText = 'true', falseText = 'false'): boolean | undefined =>
	val === trueText ? true : val === falseText ? false : undefined;

/**
 * Convert target string to integer
 *
 * @param val the target string
 * @param throwOnNan Throw an error if it is NaN
 * @returns number: val is a valid integer
 * @returns NaN: val is a not valid integer
 */
export const convertStringToInt = (val: string, throwOnNan = false): number => {
	const parsed = parseInt(val, 10);
	if (val !== parsed.toString()) {
		if (throwOnNan) throw new InvalidParameterValueError(`Could not convert ${val} to number`);
		return Number.NaN;
	}
	return parsed;
};
