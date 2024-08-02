/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/naming-convention */
import * as t from 'io-ts';
import { optional } from 'io-ts-extra';

const AttributeGenericTargetGroup = t.type({
	generalTargetGroup: t.string,
});

const ArticleAttributes = t.type({
	attributeGenericSeason: t.array(t.string),
	attributeGenericArticleTitle: t.string,
	attributeX_migration_tickle: optional(t.string),
	attributeGenericBrand: t.string,
	attributeGenericManufacturerColor: t.string,
	attributeX_gkkSapForward_warenGruppe: t.string,
	attributeX_gkkSapForward_merkmalBeiFarbenBeiVarianten: t.string,
	attributeX_gkkSapForward_season: t.string,
	attributeGenericTargetGroup: AttributeGenericTargetGroup,
	attributeX_gkkSapForward_merkmalHauptgroessenBeiVarianten: t.string,
	attributeX_gkkSapForward_konsumThemaDescription: t.string,
	attributeGenericColor: t.array(t.string),
});

const Aux = t.type({
	legacyVID: t.string,
	preisbindungsKennzeichen: t.string,
	artikelTyp: optional(t.string),
	konsumThema: t.string,
	datumGueltigAb: t.string,
	departmentId: t.string,
	datumGueltigBis: t.string,
	legacyPID: t.string,
	waehrungVerkaufspreis: t.string,
	artikelArt: optional(t.string),
	lieferantenNummer: t.string,
	artikelTypBeschreibung: t.string,
	warehouseId: optional(t.string),
	themenBaustein: t.string,
	verkaufsMengenEinheit: t.string,
	basisMengenEinheit: t.string,
	artikelnummerBeimLieferanten: t.string,
});

const Classification = t.type({
	main: t.string,
});

const ContentEnrichment = t.type({
	ts: t.string,
	source: t.string,
});

const DataSupplier = t.type({
	sourceParentRef: t.string,
});

const History = t.type({
	event: t.string,
	lifecycleStatus: t.string,
	timestamp: t.string,
});

const Lifecycle = t.type({
	contentEnrichment: t.array(ContentEnrichment),
	status: t.string,
});

const Manufacturer = t.type({
	intendedSeasons: t.array(t.string),
});

const Prices = t.type({
	priceType: t.string,
	amount: t.number,
	distributionChannels: t.array(t.string),
});

const Pricing = t.type({
	prices: t.array(Prices),
});

const Quality = t.type({
	commentOverall: t.string,
	commentLowlights: t.string,
	scoreOverall: t.string,
	scoreHighlights: t.string,
	qualityTrafficLight: t.string,
	scoreLowlights: t.string,
	commentHighlights: t.string,
});

const SupplyChain = t.type({
	id: t.string,
	sourceRef: t.string,
	sourceComment: t.string,
	aux: Aux,
});

const References = t.type({
	dataSupplier: optional(DataSupplier),
	supplyChain: t.array(SupplyChain),
	manufacturer: Manufacturer,
});

const StatusCode = t.type({
	code: t.Int,
	message: t.string,
});

export const SingleArticle = t.type({
	classification: Classification,
	vat: t.string,
	gtin: t.string,
	lifecycle: Lifecycle,
	channel: t.string,
	quality: Quality,
	articleAttributes: ArticleAttributes,
	history: t.array(History),
	references: References,
	pricing: Pricing,
	statusCode: StatusCode,
});

export const ArticleResponse = t.type({
	articles: t.array(SingleArticle),
	statusCode: StatusCode,
});
