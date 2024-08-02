import { isLeft } from 'fp-ts/lib/Either';
import * as t from 'io-ts';

import { MalformedInputError } from '../errors';

export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;

/**
 * Makes the required properties required.
 *
 * Source: https://lorefnon.tech/2020/02/02/conditionally-making-optional-properties-mandatory-in-typescript/
 *
 * Changed `T extends {}` to use a Record instead.
 */
export type MandateProps<T extends Record<string | number | symbol, unknown>, K extends keyof T> = Omit<T, K> &
	{
		[MK in K]-?: NonNullable<T[MK]>;
	};

// eslint-disable-next-line @typescript-eslint/ban-types
export function hasOwnProperty<X extends Object, Y extends PropertyKey>(obj: X, prop: Y): obj is X & Record<Y, unknown> {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function requireInt(value: unknown): t.Branded<number, t.IntBrand> {
	const intRes = t.Int.decode(value);
	if (isLeft(intRes)) throw new MalformedInputError('Expected integer', intRes);
	return intRes.right;
}

/**
 * Get the name of a property of a type
 */
export const nameof = <T>(name: keyof T): string => name as string;
