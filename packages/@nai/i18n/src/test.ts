/**
 * @nai/i18n — Tests
 */

import assert from 'node:assert/strict';
import {
  t,
  tf,
  TRANSLATIONS,
  ROUTES,
  routeFor,
  routeKeyFromPath,
  localeFromPath,
  alternatePath,
  hreflangAlternates,
  languageSwitchLabel,
  bcp47Tag,
} from './index';

function run(): void {
  // t() — translation
  assert.equal(t('nav.home', 'vi'), 'Trang chủ');
  assert.equal(t('nav.home', 'en'), 'Home');
  assert.equal(t('brand.name', 'vi'), 'Nguyễn AI');
  assert.equal(t('brand.name', 'en'), 'Nguyen AI');
  assert.equal(t('brand.product', 'vi'), 'Máy Tính AI Nguyễn');
  assert.equal(t('brand.product', 'en'), 'Nguyen AI Computer');
  console.log('✓ t() — translation');

  // t() — fallback for missing key
  assert.equal(t('nonexistent.key' as any, 'vi'), 'nonexistent.key');
  console.log('✓ t() — fallback');

  // languageSwitchLabel
  assert.equal(languageSwitchLabel('vi'), 'English');
  assert.equal(languageSwitchLabel('en'), 'Tiếng Việt');
  console.log('✓ languageSwitchLabel');

  // bcp47Tag
  assert.equal(bcp47Tag('vi'), 'vi-VN');
  assert.equal(bcp47Tag('en'), 'en');
  console.log('✓ bcp47Tag');

  // localeFromPath
  assert.equal(localeFromPath('/'), 'vi');
  assert.equal(localeFromPath('/about/'), 'vi');
  assert.equal(localeFromPath('/en/'), 'en');
  assert.equal(localeFromPath('/en/about/'), 'en');
  console.log('✓ localeFromPath');

  // routeFor
  assert.equal(routeFor('home', 'vi'), '/');
  assert.equal(routeFor('home', 'en'), '/en/');
  assert.equal(routeFor('about', 'vi'), '/about/');
  assert.equal(routeFor('about', 'en'), '/en/about/');
  console.log('✓ routeFor');

  // routeKeyFromPath
  assert.equal(routeKeyFromPath('/'), 'home');
  assert.equal(routeKeyFromPath('/en/'), 'home');
  assert.equal(routeKeyFromPath('/about/'), 'about');
  assert.equal(routeKeyFromPath('/en/about/'), 'about');
  assert.equal(routeKeyFromPath('/nonexistent/'), null);
  console.log('✓ routeKeyFromPath');

  // alternatePath
  assert.equal(alternatePath('/'), '/en/');
  assert.equal(alternatePath('/en/'), '/');
  assert.equal(alternatePath('/about/'), '/en/about/');
  assert.equal(alternatePath('/en/about/'), '/about/');
  console.log('✓ alternatePath');

  // hreflangAlternates
  const alts = hreflangAlternates('about', 'https://nguyenai.net');
  assert.equal(alts.length, 3);
  assert.equal(alts[0]!.hreflang, 'vi-VN');
  assert.equal(alts[0]!.href, 'https://nguyenai.net/about/');
  assert.equal(alts[1]!.hreflang, 'en');
  assert.equal(alts[1]!.href, 'https://nguyenai.net/en/about/');
  assert.equal(alts[2]!.hreflang, 'x-default');
  assert.equal(alts[2]!.href, 'https://nguyenai.net/about/');
  console.log('✓ hreflangAlternates');

  // Brand naming lock compliance
  assert.equal(t('brand.name', 'vi'), 'Nguyễn AI');
  assert.equal(t('brand.name', 'en'), 'Nguyen AI');
  assert.equal(t('brand.product', 'vi'), 'Máy Tính AI Nguyễn');
  assert.equal(t('brand.product', 'en'), 'Nguyen AI Computer');
  console.log('✓ Brand naming lock compliance');

  // All routes have both vi and en paths
  for (const route of ROUTES) {
    assert.ok(route.vi.startsWith('/'), `route ${route.key} vi must start with /`);
    assert.ok(route.en.startsWith('/en/'), `route ${route.key} en must start with /en/`);
    assert.ok(route.labelVi, `route ${route.key} missing labelVi`);
    assert.ok(route.labelEn, `route ${route.key} missing labelEn`);
  }
  console.log(`✓ All ${ROUTES.length} routes have vi + en paths`);

  // All translations have both vi and en
  for (const [key, entry] of Object.entries(TRANSLATIONS)) {
    assert.ok(entry.vi, `translation ${key} missing vi`);
    assert.ok(entry.en, `translation ${key} missing en`);
  }
  console.log(`✓ All ${Object.keys(TRANSLATIONS).length} translations have vi + en`);

  console.log('\nAll @nai/i18n tests passed.');
}

run();
