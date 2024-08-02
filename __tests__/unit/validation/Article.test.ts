import 'source-map-support/register';

// test stuff
// eslint-disable-next-line import/order
import { apiTimeout, loadJestEnv } from '../../utils/helpers';
loadJestEnv();

import { isLeft } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';

import { getArticleFromPL, getArticleList } from '../../../src/communication/ProductLake';
import { Article } from '../../../src/lib/api-productlake';
import { EChannels } from '../../../src/communication/ProductLake/channels';

describe('Test io-ts Type - Article:ArticleResponse', () => {
	it(
		'should fetch 100 Articles and successfully validate all of them',
		async () => {
			const numArticlesToTest = 100;
			const rawGtins = await getArticleList({ limit: numArticlesToTest, channel: EChannels.sapForward });
			const gtins = rawGtins.slice(0, numArticlesToTest);

			const articlePromises = gtins.map(async (gtin) => getArticleFromPL(gtin, EChannels.sapForward));

			const articles = await Promise.allSettled(articlePromises);

			/// @ts-expect-error // Typescript does not know that fulfilled promises always contain a Value
			const validations = articles.filter((a) => a.status === 'fulfilled').map((a) => Article.decode(a.value));

			const lefts = validations.filter((v) => isLeft(v));

			lefts.forEach((v) => {
				console.log(PathReporter.report(v));
			});

			// Compare the result with the expected result
			expect(lefts.length).toEqual(0);
			expect(validations.length).toBeGreaterThan(numArticlesToTest * 0.9);
		},
		apiTimeout,
	);

	it(
		'Should find at least one Article with /webshop.?Flag/i',
		async () => {
			const numArticlesToTest = 100;
			const gtins = (await getArticleList({ limit: numArticlesToTest, channel: EChannels.sapForward })).slice(0, numArticlesToTest);

			const articlePromises = gtins.map(async (gtin) => getArticleFromPL(gtin, EChannels.sapForward));

			/// @ts-expect-error // Typescript does not know that fulfilled promises always contain a Value
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			const articles = (await Promise.allSettled(articlePromises)).filter((a) => a.status === 'fulfilled').map((a) => a.value);
			const thingsWithWebshopFlag = articles.map((a) => JSON.stringify(a)).filter((str) => /webshop.?Flag/i.test(str));

			// console.log(thingsWithWebshopFlag);
			expect(thingsWithWebshopFlag.length).not.toEqual(0);
		},
		apiTimeout,
	);
});
