import 'source-map-support/register';

import faker from 'faker';

import * as Sizes from '../../../src/processing/Size';
import { getEinzelartikel, fashionSizes, getProduct } from '../../utils/Article';

describe('Test the Size Functions', () => {
	it('getSizeFromArticle', () => {
		const testArticle = getEinzelartikel();

		testArticle.articleAttributes.attributeGenericManufacturerSize = 'M';
		expect(Sizes.getSizeFromArticle(testArticle)).toBe('M');

		testArticle.articleAttributes.attributeGenericManufacturerSize = ' M';
		expect(Sizes.getSizeFromArticle(testArticle)).toBe('M');

		testArticle.articleAttributes.attributeGenericManufacturerSize = ' M  ';
		expect(Sizes.getSizeFromArticle(testArticle)).toBe('M');
	});

	it('getArticleForSize', () => {
		const relSizes = fashionSizes.letters;
		const articles = relSizes.map((s) => {
			const a = getEinzelartikel();
			a.articleAttributes.attributeGenericManufacturerSize = s;
			return a;
		});

		const size = faker.random.arrayElement(relSizes);
		const article = Sizes.getArticleForSize(size, articles);
		expect(Sizes.getSizeFromArticle(article)).toBe(size);
	});

	it('getSizemappingSelector', () => {
		try {
			const product = getProduct();
			const selector = Sizes.getSizemappingSelector(product.articles ?? []);

			expect(selector).toBeDefined();
		} catch (err) {
			fail(err);
		}
	});

	it('filterAndOrderArticlesBySizeMapping with standard size', () => {
		const product = getProduct(['S', ' M', 'L ', 'XL']);
		if (!Array.isArray(product.articles)) {
			fail('expected an array of articles');
		}

		const selector = Sizes.getSizemappingSelector(product.articles ?? []);

		const sizes = ['M', 'L'];
		const orderedArticles = Sizes.filterAndOrderArticlesBySizeMapping(product.articles, {
			...selector,
			_id: '123',
			active: true,
			productionAllowed: true,
			sizes: sizes,
			disallowedSizes: [],
		});

		expect(orderedArticles[0].articleAttributes.attributeGenericManufacturerSize.trim()).toBe(sizes[0]);
		expect(orderedArticles[1].articleAttributes.attributeGenericManufacturerSize.trim()).toBe(sizes[1]);
	});

	it('filterAndOrderArticlesBySizeMapping with ONESIZE', () => {
		const product = getProduct(['OneSize']);
		if (!Array.isArray(product.articles)) {
			fail('expected an array of articles');
		}

		const selector = Sizes.getSizemappingSelector(product.articles ?? []);

		const sizes = ['M', 'L', '99', '1 Size'];
		const orderedArticles = Sizes.filterAndOrderArticlesBySizeMapping(product.articles, {
			...selector,
			_id: '123',
			active: true,
			productionAllowed: true,
			sizes: sizes,
			disallowedSizes: [],
		});

		expect(orderedArticles[0].articleAttributes.attributeGenericManufacturerSize.trim()).toBe('OneSize');
	});
});
