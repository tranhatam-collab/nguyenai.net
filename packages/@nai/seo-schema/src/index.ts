/**
 * @nai/seo-schema — schema.org structured data generators
 *
 * Per FOUNDER_BRAND_NAMING_LOCK_2026-07-04:
 * - VI master brand: "Nguyễn AI"
 * - EN master brand: "Nguyen AI"
 * - VI core product: "Máy Tính AI Nguyễn"
 * - EN core product: "Nguyen AI Computer"
 *
 * Per NGUYEN_AI_SEO_SPEC.md:
 * - Use JSON-LD format
 * - Use @graph for multiple entities on one page
 * - Include hreflang alternates in WebSite
 */

export type Locale = 'vi' | 'en';

export interface SchemaOrgBase {
  '@context': 'https://schema.org';
}

export interface OrganizationSchema extends SchemaOrgBase {
  '@type': 'Organization';
  name: string;
  alternateName?: string;
  url: string;
  logo?: string;
  slogan?: string;
  sameAs?: string[];
  contactPoint?: {
    '@type': 'ContactPoint';
    contactType: string;
    telephone?: string;
    email?: string;
    availableLanguage: string[];
  };
}

export interface WebSiteSchema extends SchemaOrgBase {
  '@type': 'WebSite';
  name: string;
  url: string;
  inLanguage: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

export interface ProductSchema extends SchemaOrgBase {
  '@type': 'Product';
  name: string;
  description: string;
  brand: { '@type': 'Brand'; name: string };
  url: string;
  category: string;
  offers?: {
    '@type': 'AggregateOffer';
    priceCurrency: string;
    lowPrice: string;
    highPrice: string;
    offerCount: number;
  };
}

export interface WebPageSchema extends SchemaOrgBase {
  '@type': 'WebPage';
  headline: string;
  name: string;
  description: string;
  url: string;
  inLanguage: string;
  isPartOf?: { '@type': 'WebSite'; name: string; url: string };
  breadcrumb?: BreadcrumbListSchema;
}

export interface ArticleSchema extends SchemaOrgBase {
  '@type': 'Article';
  headline: string;
  name: string;
  description: string;
  url: string;
  inLanguage: string;
  author: { '@type': 'Organization'; name: string };
  publisher: { '@type': 'Organization'; name: string; url: string };
  datePublished?: string;
  dateModified?: string;
}

export interface FAQPageSchema extends SchemaOrgBase {
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: { '@type': 'Answer'; text: string };
  }>;
}

export interface BreadcrumbListSchema extends SchemaOrgBase {
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

export interface CourseSchema extends SchemaOrgBase {
  '@type': 'Course';
  name: string;
  description: string;
  url: string;
  inLanguage: string;
  provider: { '@type': 'Organization'; name: string; url: string };
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
  };
}

export interface ScholarshipEventSchema extends SchemaOrgBase {
  '@type': 'Event';
  name: string;
  description: string;
  url: string;
  inLanguage: string;
  eventStatus: 'EventScheduled';
  eventMode?: 'Online';
  startDate?: string;
  endDate?: string;
  organizer: { '@type': 'Organization'; name: string; url: string };
  offers?: {
    '@type': 'Offer';
    price: '0';
    priceCurrency: 'VND';
    description: string;
  };
}

export interface PersonSchema extends SchemaOrgBase {
  '@type': 'Person';
  name: string;
  url: string;
  jobTitle?: string;
  worksFor?: { '@type': 'Organization'; name: string };
}

export type Schema =
  | OrganizationSchema
  | WebSiteSchema
  | ProductSchema
  | WebPageSchema
  | ArticleSchema
  | FAQPageSchema
  | BreadcrumbListSchema
  | CourseSchema
  | ScholarshipEventSchema
  | PersonSchema;

export interface GraphSchema extends SchemaOrgBase {
  '@graph': Schema[];
}

// ============================================================
// Brand constants (per FOUNDER_BRAND_NAMING_LOCK_2026-07-04)
// ============================================================

export const BRAND = {
  nameVi: 'Nguyễn AI',
  nameEn: 'Nguyen AI',
  productVi: 'Máy Tính AI Nguyễn',
  productEn: 'Nguyen AI Computer',
  url: 'https://nguyenai.net',
  logoUrl: 'https://nguyenai.net/logo.png',
} as const;

// ============================================================
// Generators
// ============================================================

export function organizationSchema(locale: Locale): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND.nameEn,
    alternateName: BRAND.nameVi,
    url: BRAND.url,
    logo: BRAND.logoUrl,
    slogan: locale === 'vi'
      ? 'Cội nguồn vững. Trí tuệ mạnh. Vận hành toàn cầu.'
      : 'Rooted identity. Powerful intelligence. Global execution.',
    sameAs: [
      'https://twitter.com/nguyenai',
      'https://github.com/nguyenai',
      'https://www.linkedin.com/company/nguyenai',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'contact@nguyenai.net',
      availableLanguage: ['Vietnamese', 'English'],
    },
  };
}

export function webSiteSchema(locale: Locale): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: locale === 'vi' ? BRAND.nameVi : BRAND.nameEn,
    url: BRAND.url,
    inLanguage: locale === 'vi' ? 'vi-VN' : 'en',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BRAND.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function productSchema(locale: Locale, opts?: {
  description?: string;
  lowPrice?: string;
  highPrice?: string;
  offerCount?: number;
}): ProductSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: BRAND.productEn,
    description: opts?.description ?? (locale === 'vi'
      ? 'Máy Tính AI Nguyễn — AI Computer cho thế hệ Nguyễn toàn cầu.'
      : 'Nguyen AI Computer — AI Computer for the Global Nguyen Generation.'),
    brand: { '@type': 'Brand', name: BRAND.nameEn },
    url: BRAND.url,
    category: 'AI Computer',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'VND',
      lowPrice: opts?.lowPrice ?? '0',
      highPrice: opts?.highPrice ?? '7999000',
      offerCount: opts?.offerCount ?? 9,
    },
  };
}

export function webPageSchema(locale: Locale, opts: {
  headline: string;
  name: string;
  description: string;
  url: string;
  breadcrumb?: BreadcrumbListSchema;
}): WebPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    headline: opts.headline,
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: locale === 'vi' ? 'vi-VN' : 'en',
    isPartOf: { '@type': 'WebSite', name: BRAND.nameEn, url: BRAND.url },
    breadcrumb: opts.breadcrumb,
  };
}

export function articleSchema(locale: Locale, opts: {
  headline: string;
  name: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
}): ArticleSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: locale === 'vi' ? 'vi-VN' : 'en',
    author: { '@type': 'Organization', name: BRAND.nameEn },
    publisher: { '@type': 'Organization', name: BRAND.nameEn, url: BRAND.url },
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
  };
}

export function faqPageSchema(faqs: Array<{ question: string; answer: string }>): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function breadcrumbListSchema(items: Array<{ name: string; url: string }>): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function courseSchema(locale: Locale, opts: {
  name: string;
  description: string;
  url: string;
  price?: string;
}): CourseSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: locale === 'vi' ? 'vi-VN' : 'en',
    provider: { '@type': 'Organization', name: BRAND.nameEn, url: BRAND.url },
    offers: opts.price
      ? { '@type': 'Offer', price: opts.price, priceCurrency: 'VND' }
      : undefined,
  };
}

export function scholarshipEventSchema(locale: Locale, opts: {
  name: string;
  description: string;
  url: string;
  startDate?: string;
  endDate?: string;
}): ScholarshipEventSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: locale === 'vi' ? 'vi-VN' : 'en',
    eventStatus: 'EventScheduled',
    eventMode: 'Online',
    startDate: opts.startDate,
    endDate: opts.endDate,
    organizer: { '@type': 'Organization', name: BRAND.nameEn, url: BRAND.url },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
      description: locale === 'vi'
        ? 'Học bổng miễn phí cho người đủ điều kiện.'
        : 'Free scholarship for qualified applicants.',
    },
  };
}

export function personSchema(opts: {
  name: string;
  url: string;
  jobTitle?: string;
}): PersonSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: opts.name,
    url: opts.url,
    jobTitle: opts.jobTitle,
    worksFor: { '@type': 'Organization', name: BRAND.nameEn },
  };
}

// ============================================================
// Graph builder — combine multiple schemas into @graph
// ============================================================

export function buildGraph(schemas: Schema[]): GraphSchema {
  return {
    '@context': 'https://schema.org',
    '@graph': schemas,
  };
}

/**
 * Build the default graph for a standard page:
 * Organization + WebSite + (optional) WebPage + (optional) FAQ
 */
export function defaultPageGraph(locale: Locale, opts?: {
  page?: Parameters<typeof webPageSchema>[1];
  faqs?: Array<{ question: string; answer: string }>;
}): GraphSchema {
  const schemas: Schema[] = [
    organizationSchema(locale),
    webSiteSchema(locale),
  ];
  if (opts?.page) {
    schemas.push(webPageSchema(locale, opts.page));
  }
  if (opts?.faqs?.length) {
    schemas.push(faqPageSchema(opts.faqs));
  }
  return buildGraph(schemas);
}

/**
 * Serialize a schema to JSON-LD script tag content.
 */
export function toJsonLd(schema: Schema | GraphSchema): string {
  return JSON.stringify(schema);
}
