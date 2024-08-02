import { isLeft } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';

import { getArticleFromPL, getArticleList } from './communication/ProductLake';
import { EChannels } from './communication/ProductLake/channels';
import { ArticleResponse } from './validation/Article';

void (async function doStuff() {
	const gtins = await getArticleList({ limit: 10, channel: EChannels.sapForward });

	const articlePromises = gtins.map(async (gtin) => getArticleFromPL(gtin, EChannels.sapForward));

	const articles = await Promise.allSettled(articlePromises);

	const validations = articles.filter((a) => a.status === 'fulfilled').map((a) => ArticleResponse.decode(a));

	const lefts = validations.filter((v) => isLeft(v));

	lefts.forEach((v) => {
		console.log(PathReporter.report(v));
	});
})();
