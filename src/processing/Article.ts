import { Article, ArticleAttributes, AttributeGenericManufacturerColor } from '../lib/api-productlake';
import { requireSingleValue } from '../utils/general';
import { hasOwnProperty } from '../utils/ts';
import { InvalidParameterValueError } from '../errors';

/**
 * Returns an Array with all unique attributes of an array.
 *
 * Can remove undefined if required.
 *
 * @param articles Array with Articles
 * @param attribute Name of the attribute
 * @param removeUndefined true to remove undefined from output
 */
export function getAllUniqueAttributes<T extends keyof ArticleAttributes>(articles: Article[], attribute: T): Array<ArticleAttributes[T] | undefined>;
export function getAllUniqueAttributes<T extends keyof ArticleAttributes>(
	articles: Article[],
	attribute: T,
	removeUndefined: false,
): Array<ArticleAttributes[T] | undefined>;
export function getAllUniqueAttributes<T extends keyof ArticleAttributes>(
	articles: Article[],
	attribute: T,
	removeUndefined: true,
): Array<NonNullable<ArticleAttributes[T]>>;
export function getAllUniqueAttributes<T extends keyof ArticleAttributes>(
	articles: Article[],
	attribute: T,
	removeUndefined = false,
): Array<ArticleAttributes[T] | undefined> | Array<ArticleAttributes[T]> {
	const values = articles.map((a) => a.articleAttributes?.[attribute]);
	const set = new Set(values);
	if (removeUndefined) set.delete(undefined);
	return Array.from(set.values());
}

export function requireSingleAttributeValue<T extends keyof ArticleAttributes>(articles: Article[], attribute: T): ArticleAttributes[T] {
	const allAttributes = getAllUniqueAttributes(articles, attribute);
	/// @ts-expect-error // We declared the return type, this is fine.
	return requireSingleValue(allAttributes);
}

/**
 * Return product type get from articles
 */
export function getProductTypeFromArticles(articles: Article[]): string {
	const articleTypes = articles.map(
		/// @ts-expect-error // this is not in the API Specification but it should exists
		(a) => a.references?.supplyChain?.find((s) => s.aux != null && hasOwnProperty(s.aux, 'artikelTyp'))?.aux?.artikelTyp as string,
	);
	return requireSingleValue(articleTypes, true);
}

export function hasWebshopFlag(this: void, article: Article | null | undefined): boolean {
	/// @ts-expect-error // this is not in the api specification yet
	return article?.articleAttributes?.attributeX_gkkSapForward_webshopFlag === 'J';
}

export function getArticleTitle(article: Article): string {
	const title = article.articleAttributes?.attributeGenericArticleTitle;
	if (title == null) throw new InvalidParameterValueError('Got a nullish attributeGenericArticleTitle');
	return title;
}

export function getArticleColor(article: Article): AttributeGenericManufacturerColor | undefined {
	return article.articleAttributes?.attributeGenericManufacturerColor;
}
