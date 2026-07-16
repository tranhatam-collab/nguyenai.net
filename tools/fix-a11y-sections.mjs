#!/usr/bin/env node
/**
 * fix-a11y-sections.mjs — Add aria-label to <section> and <nav> tags missing them.
 * Extracts heading text from within the section/nav to use as aria-label.
 * Falls back to class name or generic label.
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const ROOT = new URL('..', import.meta.url).pathname;

// Get all .astro files with <section> or <nav> without aria-label
const files = execSync(
  `find ${ROOT}/apps -type f -name "*.astro" -not -path "*/node_modules/*" -not -path "*/dist/*" | sort`,
  { encoding: 'utf-8' }
).trim().split('\n');

let fixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;

  // Fix <section> tags without aria-label or aria-labelledby
  content = content.replace(/<section([^>]*?)>/g, (match, attrs) => {
    if (/\b(aria-label|aria-labelledby)\b/.test(attrs)) return match;

    // Try to find heading text within the section
    const afterMatch = content.slice(content.indexOf(match) + match.length);
    const headingMatch = afterMatch.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/);
    let label = '';
    if (headingMatch) {
      label = headingMatch[1].trim();
    } else {
      // Try class name
      const classMatch = attrs.match(/class="([^"]+)"/);
      if (classMatch) {
        const cls = classMatch[1].split(' ')[0];
        label = cls.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      } else {
        label = 'Content section';
      }
    }

    modified = true;
    fixed++;
    return `<section${attrs} aria-label="${label.replace(/"/g, '&quot;')}">`;
  });

  // Fix <nav> tags without aria-label
  content = content.replace(/<nav([^>]*?)>/g, (match, attrs) => {
    if (/\b(aria-label|aria-labelledby)\b/.test(attrs)) return match;

    // Try to find heading text
    const afterMatch = content.slice(content.indexOf(match) + match.length);
    const headingMatch = afterMatch.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/);
    let label = '';
    if (headingMatch) {
      label = headingMatch[1].trim();
    } else {
      const classMatch = attrs.match(/class="([^"]+)"/);
      if (classMatch) {
        label = classMatch[1].split(' ')[0].replace(/[-_]/g, ' ');
      } else {
        label = 'Navigation';
      }
    }

    modified = true;
    fixed++;
    return `<nav${attrs} aria-label="${label.replace(/"/g, '&quot;')}">`;
  });

  if (modified) {
    writeFileSync(file, content);
  }
}

console.log(`Fixed ${fixed} accessibility violations (added aria-label to section/nav tags)`);
