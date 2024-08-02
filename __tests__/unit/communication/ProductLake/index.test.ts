import 'source-map-support/register';

// test stuff
import { apiTimeout, loadJestEnv } from '../../../utils/helpers';
loadJestEnv();

// Stuff from src
import { getArticleFromPL } from '../../../../src/communication/ProductLake';
import { InvalidAPIResponseError } from '../../../../src/errors/InvalidAPIResponse';
import { getApiEndpoint } from '../../../../src/utils/network';
import { hasOwnProperty } from '../../../../src/utils/ts';
import { EChannels } from '../../../../src/communication/ProductLake/channels';

const api = getApiEndpoint();

async function getValidGTIN() {
	const result = await api.get<{ gtins: string[] }>('/article/list', {
		headers: {
			limit: 1,
			channel: EChannels.sapForward,
		},
	});

	if (result.status !== 200) throw new InvalidAPIResponseError(`expected status 200, got ${result.status}`);

	return result.data.gtins[0];
}

describe('Test Productlake API Calls - getArticleFromPL', () => {
	it(
		'should return an article',
		async () => {
			const gtin = await getValidGTIN();
			const result = await getArticleFromPL(gtin, EChannels.sapForward);

			expect(typeof result).toEqual('object');
			expect(result).toHaveProperty('gtin');
		},
		apiTimeout,
	);
	it(
		'should return the article with the same GTIN',
		async () => {
			const gtin = await getValidGTIN();
			const result = await getArticleFromPL(gtin, EChannels.sapForward);

			expect(typeof result).toEqual('object');
			expect(result).toHaveProperty('gtin');
			if (typeof result === 'object' && result !== null && hasOwnProperty(result, 'gtin')) {
				expect(result.gtin).toEqual(gtin);
			}
		},
		apiTimeout,
	);
	it(
		'should return an article',
		async () => {
			const gtin = await getValidGTIN();
			const result = await getArticleFromPL(gtin, EChannels.sapForward);

			expect(typeof result).toEqual('object');
			expect(result).toHaveProperty('gtin');
		},
		apiTimeout,
	);
	it(
		'should return the article with the same GTIN',
		async () => {
			const gtin = await getValidGTIN();
			const result = await getArticleFromPL(gtin, EChannels.sapForward);

			expect(typeof result).toEqual('object');
			expect(result).toHaveProperty('gtin');
			if (typeof result === 'object' && result !== null && hasOwnProperty(result, 'gtin')) {
				expect(result.gtin).toEqual(gtin);
			}
		},
		apiTimeout,
	);
});
