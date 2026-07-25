// Required / recommended fields for the schema.org types that power Google rich
// results. Data-driven so the JSON-LD auditor stays generic.

export interface SchemaDef {
  required: string[]
  recommended: string[]
  /** At least one of these must be present (e.g. a Product needs a price/rating). */
  anyOf?: string[]
}

export const SCHEMA_DEFS: Record<string, SchemaDef> = {
  Article: {
    required: ['headline'],
    recommended: ['image', 'datePublished', 'author', 'dateModified'],
  },
  NewsArticle: {
    required: ['headline'],
    recommended: ['image', 'datePublished', 'author', 'dateModified'],
  },
  BlogPosting: {
    required: ['headline'],
    recommended: ['image', 'datePublished', 'author', 'dateModified'],
  },
  Product: {
    required: ['name'],
    recommended: ['image', 'description', 'brand', 'sku'],
    anyOf: ['offers', 'review', 'aggregateRating'],
  },
  Recipe: {
    required: ['name', 'image', 'recipeIngredient', 'recipeInstructions'],
    recommended: ['author', 'datePublished', 'prepTime', 'cookTime', 'totalTime', 'recipeYield'],
  },
  BreadcrumbList: {
    required: ['itemListElement'],
    recommended: [],
  },
  Organization: {
    required: ['name'],
    recommended: ['url', 'logo', 'sameAs'],
  },
  WebSite: {
    required: ['name', 'url'],
    recommended: ['potentialAction'],
  },
  FAQPage: {
    required: ['mainEntity'],
    recommended: [],
  },
  LocalBusiness: {
    required: ['name', 'address'],
    recommended: ['telephone', 'openingHours', 'geo', 'image', 'priceRange'],
  },
  Person: {
    required: ['name'],
    recommended: ['url', 'image', 'jobTitle'],
  },
  Event: {
    required: ['name', 'startDate', 'location'],
    recommended: ['endDate', 'image', 'offers', 'description'],
  },
  VideoObject: {
    required: ['name', 'description', 'thumbnailUrl', 'uploadDate'],
    recommended: ['duration', 'contentUrl', 'embedUrl'],
  },
  Review: {
    required: ['reviewRating', 'author'],
    recommended: ['itemReviewed', 'datePublished'],
  },
  HowTo: {
    required: ['name', 'step'],
    recommended: ['image', 'totalTime', 'tool', 'supply'],
  },
}
