/**
 * Requires an array to have exactly one element.
 *
 * @param values Array with values
 * @returns First Array Element
 */
export function requireSingleValue<T>(values: T[], removeDuplicates = false): T {
	if (values.length === 0) throw new Error('No attributes received');
	const newValues = removeDuplicates ? Array.from(new Set(values)) : values;
	if (newValues.length > 1) throw new Error(`Expected a single attruibute to be present in all articles. Got: ${newValues.join(', ')}`);
	return newValues[0];
}

/**
 * Removes all nullish values from an array.
 *
 * @param arr Array
 * @returns Array without undefined or null
 */
export function removeNullableFromArr<T>(arr: T[]): Array<NonNullable<T>> {
	/// @ts-expect-error // typescript can not understand our filter
	return arr.filter((a) => a != null);
}

/**
 * Exclude null and undefined from T
 */
type NonSymbol<T> = T extends symbol ? never : T;

/**
 * Removes all symbols from an array.
 *
 * @param arr Array
 * @returns Array without symbols
 */
export function removeSymbolsFromArr<T>(arr: T[]): Array<NonSymbol<T>> {
	/// @ts-expect-error // typescript can not understand our filter
	return arr.filter((a) => typeof a !== 'symbol');
}

/**
 * Trim space and remove duplicate character of array string.
 *
 * @param arr Array<string>
 * @returns Array without white space or duplicate character
 */
export function trimAndRemoveDuplicateFromArr(arr: string[]): string[] {
	return Array.from(new Set(arr.map((str: string) => str.trim())));
}

/**
 * Trim the keys of an object.
 *
 * @param obj Map
 * @returns object without redundant spaces
 */
export function trimTheKeysOfMap<T>(obj: Record<string, T> = {}): Record<string, T> {
	const newObj: Record<string, T> = {};
	Object.entries(obj).forEach(([key, value]) => {
		newObj[key.trim()] = value;
	});

	return newObj;
}
