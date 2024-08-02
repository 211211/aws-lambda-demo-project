import * as t from 'io-ts';

import { typeEventBody } from './EventBody';

interface IbrandEvent {
	readonly brandEventWithoutBody: unique symbol;
}

const brandEventWithoutBody = t.type({
	pathParameters: t.type({
		brand: t.string,
	}),
});

export const typeBrandEventWithoutBody = t.brand(
	brandEventWithoutBody,
	(event): event is t.Branded<t.TypeOf<typeof brandEventWithoutBody>, IbrandEvent> => event.pathParameters.brand.length > 0,
	'brandEventWithoutBody',
);

export const typeBrandEventWithBody = t.intersection([typeBrandEventWithoutBody, typeEventBody]);
