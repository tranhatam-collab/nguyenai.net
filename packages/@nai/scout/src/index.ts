/**
 * @nai/scout — Browser automation for NAI.
 *
 * Per Founder Build Directive P1-B.8 / P1-C.2:
 *   Browser: fetch pages, parse HTML, extract structured data, follow links.
 *
 * Responsibilities:
 * - Fetch web pages with configurable headers, timeout
 * - Parse HTML and extract text, links, images, metadata
 * - CSS selector-based extraction
 * - Structured data extraction (JSON-LD, OpenGraph, tables)
 * - Rate limiting and polite crawling (robots.txt awareness)
 * - Session management (cookies, auth)
 *
 * MVP: Uses fetch() + DOMParser. In Workers, DOMParser is not available —
 * a lightweight regex-based parser is used as fallback.
 */

// ============================================================
// Types
// ============================================================

export interface FetchOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: string;
}

export interface FetchResult {
  url: string;
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: string;
  fetchedAt: string;
}

export interface PageData {
  url: string;
  title: string;
  description: string;
  text: string;
  links: { href: string; text: string }[];
  images: { src: string; alt: string }[];
  meta: Record<string, string>;
  jsonLd: unknown[];
}

export interface ExtractRule {
  selector: string;
  attribute?: string;
  multiple?: boolean;
}

export interface ExtractResult {
  [key: string]: string | string[] | null;
}

// ============================================================
// Fetch
// ============================================================

// ============================================================
// Fetch
// ============================================================

function matchesPattern(url: string, pattern: string): boolean {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
  return regex.test(url);
}

function isUrlAllowed(url: string, opts: FetchOptions): boolean {
  const { allowlist, denylist } = opts;
  if (denylist && denylist.length > 0) {
    for (const pattern of denylist) {
      if (matchesPattern(url, pattern)) return false;
    }
  }
  if (allowlist && allowlist.length > 0) {
    for (const pattern of allowlist) {
      if (matchesPattern(url, pattern)) return true;
    }
    return false;
  }
  return true;
}

export async function fetchPage(url: string, opts: FetchOptions = {}): Promise<FetchResult> {
    response.headers.forEach((value, key) => { headers[key] = value; });

    return {
      url,
      status: response.status,
      ok: response.ok,
      headers,
      body,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      url,
      status: 0,
      ok: false,
      headers: {},
      body: '',
      error: String(err),
      fetchedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}
  if (denylist && denylist.length > 0) {
    for (const pattern of denylist) {
      if (matchesPattern(url, pattern)) return false;
    }
  }
  if (allowlist && allowlist.length > 0) {
    for (const pattern of allowlist) {
      if (matchesPattern(url, pattern)) return true;
    }
    return false;
  }
  return true;
}

export async function fetchPage(url: string, opts: FetchOptions = {}): Promise<FetchResult> {
    response.headers.forEach((value, key) => { headers[key] = value; });

    return {
      url,
      status: response.status,
      ok: response.ok,
      headers,
      body,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      url,
      status: 0,
      ok: false,
      headers: {},
      body: '',
      error: String(err),
      fetchedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** Extract text content between tags. */
export function extractText(html: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  const match = regex.exec(html);
  return match ? match[1]!.replace(/<[^>]*>/g, '').trim() : '';
}

/** Extract attribute from all matching tags. */
export function extractAttributes(
  html: string,
  tag: string,
  attribute: string,
): { value: string; text: string }[] {
  const results: { value: string; text: string }[] = [];
  const regex = new RegExp(`<${tag}[^>]*${attribute}=["']([^"']*)["'][^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    results.push({ value: match[1]!, text: match[2]!.replace(/<[^>]*>/g, '').trim() });
  }
  return results;
}

/** Extract all meta tags. */
export function extractMeta(html: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const regex = /<meta\s+(?:name|property)=["']([^"']+)["']\s+content=["']([^"']*)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    meta[match[1]!] = match[2]!;
  }
  return meta;
}

/** Extract JSON-LD blocks. */
export function extractJsonLd(html: string): unknown[] {
  const results: unknown[] = [];
  const regex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    try {
      results.push(JSON.parse(match[1]!.trim()));
    } catch {
      // Skip invalid JSON-LD
    }
  }
  return results;
}

/** Extract all links from HTML. */
export function extractLinks(html: string, baseUrl?: string): { href: string; text: string }[] {
  const links: { href: string; text: string }[] = [];
  const regex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    let href = match[1]!;
    if (baseUrl && href.startsWith('/')) {
      href = new URL(href, baseUrl).href;
    }
    if (baseUrl && !href.startsWith('http')) {
      try { href = new URL(href, baseUrl).href; } catch { /* keep as-is */ }
    }
    links.push({ href, text: match[2]!.replace(/<[^>]*>/g, '').trim() });
  }
  return links;
}

/** Extract all images from HTML. */
export function extractImages(html: string, baseUrl?: string): { src: string; alt: string }[] {
  const images: { src: string; alt: string }[] = [];
  const regex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    let src = match[1]!;
    if (baseUrl && src.startsWith('/')) {
      src = new URL(src, baseUrl).href;
    }
    // Extract alt separately from the full match
    const altMatch = /alt=["']([^"']*)["']/i.exec(match[0]);
    images.push({ src, alt: altMatch ? altMatch[1]! : '' });
  }
  return images;
}

/** Strip all HTML tags and return plain text. */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// Full page parse
// ============================================================

export function parsePage(url: string, html: string): PageData {
  const title = extractText(html, 'title');
  const meta = extractMeta(html);
  const description = meta['description'] ?? meta['og:description'] ?? '';
  const text = stripHtml(html);
  const links = extractLinks(html, url);
  const images = extractImages(html, url);
  const jsonLd = extractJsonLd(html);

  return { url, title, description, text, links, images, meta, jsonLd };
}

// ============================================================
// Structured extraction
// ============================================================

export function extractByRule(html: string, rule: ExtractRule): string | string[] | null {
  // Simple CSS-like selector support: tag, tag.class, tag#id
  const selector = rule.selector;
  let regex: RegExp;

  if (selector.includes('.')) {
    const [tag, cls] = selector.split('.');
    regex = new RegExp(`<${tag}\\b[^>]*class=["'][^"']*\\b${cls}\\b[^"']*["'][^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  } else if (selector.includes('#')) {
    const [tag, id] = selector.split('#');
    regex = new RegExp(`<${tag}\\b[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  } else {
    regex = new RegExp(`<${selector}\\b[^>]*>([\\s\\S]*?)</${selector}>`, 'gi');
  }

  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    if (rule.attribute) {
      const attrRegex = new RegExp(`${rule.attribute}=["']([^"']*)["']`, 'i');
      const attrMatch = attrRegex.exec(match[0]);
      matches.push(attrMatch ? attrMatch[1]! : '');
    } else {
      matches.push(stripHtml(match[1]!));
    }
  }

  if (matches.length === 0) return null;
  return rule.multiple ? matches : matches[0]!;
}

export function extractByRules(html: string, rules: Record<string, ExtractRule>): ExtractResult {
  const result: ExtractResult = {};
  for (const [key, rule] of Object.entries(rules)) {
    result[key] = extractByRule(html, rule);
  }
  return result;
}

// ============================================================
// Crawl session (polite crawling)
// ============================================================

export interface CrawlSession {
  visited: Set<string>;
  queue: string[];
  maxPages: number;
  delayMs: number;
}

export function createCrawlSession(startUrl: string, opts: { maxPages?: number; delayMs?: number } = {}): CrawlSession {
  return {
    visited: new Set<string>(),
    queue: [startUrl],
    maxPages: opts.maxPages ?? 10,
    delayMs: opts.delayMs ?? 1000,
  };
}

export async function crawlStep(
  session: CrawlSession,
  opts: FetchOptions = {},
): Promise<{ url: string; data: PageData } | null> {
  while (session.queue.length > 0) {
    const url = session.queue.shift()!;
    if (session.visited.has(url)) continue;
    if (session.visited.size >= session.maxPages) return null;

    session.visited.add(url);

    try {
      const result = await fetchPage(url, opts);
      if (!result.ok) continue;

      const data = parsePage(url, result.body);

      // Add new links to queue
      for (const link of data.links) {
        if (!session.visited.has(link.href) && !session.queue.includes(link.href)) {
          session.queue.push(link.href);
        }
      }

      // Polite delay
      if (session.delayMs > 0) {
        await new Promise((r) => setTimeout(r, session.delayMs));
      }

      return { url, data };
    } catch {
      continue;
    }
  }
  return null;
}
