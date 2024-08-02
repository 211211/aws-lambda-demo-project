import faker from 'faker';

import { Article, AttributeGenericBrand, ProductGet } from '../../src/lib/api-productlake';

faker.seed(42);

function getRandomRangeFromArray<T>(arr: T[], min = 1, max = Number.MAX_VALUE): T[] {
	min = Math.max(min, arr.length);
	max = Math.min(max, arr.length);

	const length = faker.datatype.number({ min: min, max: max });
	const diff = arr.length - length;

	return arr.slice(diff, diff + length);
}

function getRandomNumberArray(length: number) {
	return new Array(length).fill(0).map(() => faker.datatype.number({ min: 0, max: 9 }));
}

function getRandomNumberString(length: number) {
	return getRandomNumberArray(length).join('');
}

function getRandomGtin(): string {
	const base = getRandomNumberArray(12);
	// const base = [9, 7, 8, 0, 3, 0, 6, 4, 0, 6, 1, 5];
	const checksum = 10 - (base.map((val, idx) => (idx % 2 === 0 ? val : val * 3)).reduce((a, b) => a + b, 0) % 10);
	return `${base.join('')}${checksum}`;
}

const brands: {
	[index: string]: AttributeGenericBrand;
} = {
	'0019': 'Manguun',
	'2267': 'Hudson',
	'2390': 'Bodum',
	'2707': 'Cross',
	'6147': 'MarcoTozzi',
	'6156': 'Stance',
};

export const fashionSizes = {
	letters: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
	numbers: ['36', '38', '40', '42'],
};

export function getRandomSizeRange(): string[] {
	const randomSet = faker.random.arrayElement(Object.values(fashionSizes));
	return getRandomRangeFromArray(randomSet, 2, 10);
}
export function getRandomSize(): string {
	const randomSet = faker.random.arrayElement(Object.values(fashionSizes));
	return faker.random.arrayElement(randomSet);
}

export function getEinzelartikel(): Article {
	const brand = faker.random.arrayElement(Object.entries(brands));
	return createArticle({
		brand: brand,
	});
}

interface CreateArticleData {
	brand: [string, AttributeGenericBrand];

	gtin?: string;
	rootGTIN?: string;

	artikelTyp?: string;
	konsumThema?: string;
}

function createArticle(data: CreateArticleData): Article {
	const aux = {
		konsumThema: data.konsumThema ?? `400${getRandomNumberString(3)}`,
		artikelTyp: data.artikelTyp ?? 'Einzelartikel',
		brandId: data.brand[0],
		basisMengenEinheit: 'ST',
		verkaufsMengenEinheit: 'ST',
	};

	const gtin = data.gtin ?? getRandomGtin();

	return {
		gtin: gtin,
		rootGTIN: data.rootGTIN ?? gtin,
		articleAttributes: {
			attributeGenericManufacturerColor: faker.commerce.color(),
			attributeGenericManufacturerSize: getRandomSize(),

			/// @ts-expect-error attributeX is not in the API Spec
			attributeX_gkkSapForward_brand_id: data.brand[0],
			attributeGenericBrand: data.brand[1],
		},

		references: {
			supplyChain: [
				{
					aux: aux,
				},
			],
		},
	};
}

export function makeVariante(article: Article): Article {
	const aux = article.references?.supplyChain[0].aux;

	/// @ts-expect-error aux is not typed
	aux.artikelTyp = 'Variante';

	return article;
}

export function getProduct(sizes: string[] = getRandomSizeRange()): ProductGet {
	const brand = faker.random.arrayElement(Object.entries(brands));
	const colors = new Array(faker.datatype.number({ min: 2, max: 5 })).fill('').map(() => faker.commerce.color());

	const articles: Article[] = [];

	const createArticleOptions = {
		brand: brand,
		konsumThema: `400${getRandomNumberString(3)}`,
	};

	sizes.forEach((size) => {
		colors.forEach((color) => {
			const article: Article = createArticle(createArticleOptions);
			article.articleAttributes.attributeGenericManufacturerColor = color;
			article.articleAttributes.attributeGenericManufacturerSize = size;

			articles.push(makeVariante(article));
		});
	});

	const gtins = articles.map((a) => a.gtin);
	gtins.sort();
	const rootGTIN = gtins[0];
	/// @ts-expect-error this is not yet in the API-SPEC
	articles.forEach((article) => (article.rootGTIN = rootGTIN));

	return {
		articles: articles,
	};
}
