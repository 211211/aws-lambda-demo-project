import * as t from 'io-ts';
import { chain } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';

import { InvalidParameterValueError } from '../errors';

/**
 * Check if the input string match the format YYYY-MM-DD
 */
export function isMatchDateFormat(inputStr: string): boolean {
	const dateRegex = /^\d{4}[.-]\d{2}[.-]\d{2}$/;
	return dateRegex.test(inputStr);
}

/**
 * Check if the input string is a valid date
 */
export function isValidDate(inputStr: string): boolean {
	const parsedDate = new Date(inputStr);
	if (parsedDate.toString() === 'Invalid DateTime') return false;

	// This checking will prevent invalid dates
	// For example: 2020-02-30 will be parsed to 2021-03-02T00:00:00.000Z
	return parsedDate.toISOString().includes(inputStr);
}

/**
 * Get date with format YYYY-MM-DD from a string
 *
 * Return current date if inputStr is empty
 */
export function getDateYYYYMMDD(inputStr?: string): string {
	let d = new Date();
	if (typeof inputStr === 'string') {
		// Get current date if inputStr is empty
		if (!isValidDate(inputStr)) throw new InvalidParameterValueError(`${inputStr} not a valid date`);
		d = new Date(inputStr);
	}

	return d.toISOString().split('T')[0];
}

/**
 * format date as DDMMYYYY format
 *
 * @param date date to format to string
 * @param separator date separator
 * @returns date in string format
 */
export function getDateDDMMYYYY(date: Date, separator = '-'): string {
	const zeroPad = (val: number) => `${val}`.padStart(2, '0');
	return `${zeroPad(date.getDate())}${separator}${zeroPad(date.getMonth() + 1)}${separator}${date.getFullYear()}`;
}

export type DateFromYYYYMMDDStringC = t.Type<Date, string, unknown>;
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DateFromYYYYMMDDString: DateFromYYYYMMDDStringC = new t.Type<Date, string, unknown>(
	'DateFromYYYYMMDDString',
	(u): u is Date => u instanceof Date,
	(u, c) =>
		pipe(
			t.string.validate(u, c),
			chain((s) => {
				const fragments = /([0-9]{4})-?(0[0-9]|1[0-2])-?([0-2][0-9]|30|31)/.exec(s);
				if (fragments == null) return t.failure(u, c);
				const d = new Date(`${fragments[1]}-${fragments[2]}-${fragments[3]}T00:00:00.000Z`);
				return isNaN(d.getTime()) ? t.failure(u, c) : t.success(d);
			}),
		),
	(a) => a.toISOString(),
);

export function isValidDateRange(startDate: Date, endDate: Date): boolean {
	return endDate.getTime() >= startDate.getTime();
}
