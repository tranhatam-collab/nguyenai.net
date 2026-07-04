/**
 * @nai/seo-schema — Tests
 */

import assert from 'node:assert/strict';
import {
  organizationSchema,
  webSiteSchema,
  productSchema,
  webPageSchema,
  articleSchema,
  faqPageSchema,
  breadcrumbListSchema,
  courseSchema,
  scholarshipEventSchema,
  personSchema,
  buildGraph,
  defaultPageGraph,
  toJsonLd,
  BRAND,
} from './index';

function run(): void {
  // Organization
  const org = organizationSchema('vi');
  assert.equal(org['@type'], 'Organization');
  assert.equal(org.name, 'Nguyen AI');
  assert.equal(org.alternateName, 'Nguyễn AI');
  assert.equal(org.url, 'https://nguyenai.net');
  console.log('✓ organizationSchema');

  // WebSite
  const site = webSiteSchema('en');
  assert.equal(site['@type'], 'WebSite');
  assert.equal(site.name, 'Nguyen AI');
  assert.equal(site.inLanguage, 'en');
  assert.ok(site.potentialAction?.target.includes('search'));
  console.log('✓ webSiteSchema');

  // Product
  const prod = productSchema('vi');
  assert.equal(prod['@type'], 'Product');
  assert.equal(prod.name, 'Nguyen AI Computer');
  assert.equal(prod.brand.name, 'Nguyen AI');
  assert.equal(prod.offers?.priceCurrency, 'VND');
  console.log('✓ productSchema');

  // WebPage
  const page = webPageSchema('vi', {
    headline: 'Test',
    name: 'Test Page',
    description: 'A test page',
    url: 'https://nguyenai.net/test/',
  });
  assert.equal(page['@type'], 'WebPage');
  assert.equal(page.inLanguage, 'vi-VN');
  assert.equal(page.isPartOf?.name, 'Nguyen AI');
  console.log('✓ webPageSchema');

  // Article
  const article = articleSchema('en', {
    headline: 'Test Article',
    name: 'Test Article',
    description: 'A test article',
    url: 'https://nguyenai.net/en/test/',
  });
  assert.equal(article['@type'], 'Article');
  assert.equal(article.author.name, 'Nguyen AI');
  console.log('✓ articleSchema');

  // FAQPage
  const faq = faqPageSchema([
    { question: 'What is Nguyen AI?', answer: 'An AI Computer line.' },
  ]);
  assert.equal(faq['@type'], 'FAQPage');
  assert.equal(faq.mainEntity.length, 1);
  assert.equal(faq.mainEntity[0]!['@type'], 'Question');
  console.log('✓ faqPageSchema');

  // BreadcrumbList
  const breadcrumbs = breadcrumbListSchema([
    { name: 'Home', url: 'https://nguyenai.net/' },
    { name: 'About', url: 'https://nguyenai.net/about/' },
  ]);
  assert.equal(breadcrumbs['@type'], 'BreadcrumbList');
  assert.equal(breadcrumbs.itemListElement.length, 2);
  assert.equal(breadcrumbs.itemListElement[0]!.position, 1);
  assert.equal(breadcrumbs.itemListElement[1]!.position, 2);
  console.log('✓ breadcrumbListSchema');

  // Course
  const course = courseSchema('vi', {
    name: 'AI Computer Basics',
    description: 'Learn AI Computer basics',
    url: 'https://edu.nguyenai.net/courses/basics',
    price: '299000',
  });
  assert.equal(course['@type'], 'Course');
  assert.equal(course.provider.name, 'Nguyen AI');
  assert.equal(course.offers?.price, '299000');
  console.log('✓ courseSchema');

  // ScholarshipEvent
  const scholarship = scholarshipEventSchema('en', {
    name: 'Nguyen AI Scholarship 2026',
    description: 'Scholarship for Nguyen community',
    url: 'https://nguyenai.net/scholarship/',
  });
  assert.equal(scholarship['@type'], 'Event');
  assert.equal(scholarship.eventStatus, 'EventScheduled');
  assert.equal(scholarship.offers?.price, '0');
  console.log('✓ scholarshipEventSchema');

  // Person
  const person = personSchema({
    name: 'Nguyen Lan Anh',
    url: 'https://nguyenai.net/about/',
    jobTitle: 'Founder',
  });
  assert.equal(person['@type'], 'Person');
  assert.equal(person.worksFor?.name, 'Nguyen AI');
  console.log('✓ personSchema');

  // buildGraph
  const graph = buildGraph([org, site, prod]);
  assert.equal(graph['@graph'].length, 3);
  console.log('✓ buildGraph');

  // defaultPageGraph
  const defaultGraph = defaultPageGraph('vi', {
    page: {
      headline: 'About',
      name: 'About Nguyen AI',
      description: 'About the company',
      url: 'https://nguyenai.net/about/',
    },
    faqs: [{ question: 'Q1?', answer: 'A1' }],
  });
  assert.equal(defaultGraph['@graph'].length, 4);
  console.log('✓ defaultPageGraph');

  // toJsonLd
  const json = toJsonLd(org);
  const parsed = JSON.parse(json);
  assert.equal(parsed['@type'], 'Organization');
  console.log('✓ toJsonLd');

  // Brand naming lock compliance
  assert.equal(BRAND.nameVi, 'Nguyễn AI');
  assert.equal(BRAND.nameEn, 'Nguyen AI');
  assert.equal(BRAND.productVi, 'Máy Tính AI Nguyễn');
  assert.equal(BRAND.productEn, 'Nguyen AI Computer');
  console.log('✓ Brand naming lock compliance');

  console.log('\nAll @nai/seo-schema tests passed.');
}

run();
