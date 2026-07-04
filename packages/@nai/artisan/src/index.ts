/**
 * @nai/artisan — Content generation for NAI.
 *
 * Per Founder Build Directive P1-B.8:
 *   Content generation: text, markdown, structured docs with templates and AI integration.
 *
 * Responsibilities:
 * - Template-based content generation with variable substitution
 * - Markdown rendering and formatting
 * - Structured document generation (JSON, YAML, frontmatter)
 * - Multi-format output (text, markdown, HTML, JSON)
 * - Content validation and sanitization
 * - AI-powered content enhancement (interface for @nai/prism)
 */

// ============================================================
// Types
// ============================================================

export type ContentFormat = 'text' | 'markdown' | 'html' | 'json' | 'yaml';

export interface ContentRequest {
  templateId?: string;
  format: ContentFormat;
  variables?: Record<string, unknown>;
  /** Raw content to transform (if no template). */
  content?: string;
  /** Optional metadata for the document. */
  metadata?: Record<string, unknown>;
}

export interface ContentResult {
  format: ContentFormat;
  content: string;
  metadata: Record<string, unknown>;
  generatedAt: string;
  wordCount: number;
  charCount: number;
}

export interface Template {
  id: string;
  name: string;
  format: ContentFormat;
  /** Template string with {{variable}} placeholders. */
  template: string;
  /** Required variables. */
  requiredVariables?: string[];
  /** Default values for optional variables. */
  defaultVariables?: Record<string, unknown>;
}

// ============================================================
// Template registry
// ============================================================

const templates = new Map<string, Template>();

export function registerTemplate(template: Template): void {
  templates.set(template.id, template);
}

export function getTemplate(id: string): Template | null {
  return templates.get(id) ?? null;
}

export function listTemplates(): Template[] {
  return [...templates.values()];
}

export function clearTemplates(): void {
  templates.clear();
}

// ============================================================
// Variable substitution
// ============================================================

/** Substitute {{variable}} placeholders in a template string. */
export function substituteVariables(
  template: string,
  variables: Record<string, unknown>,
): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path: string) => {
    const parts = path.split('.');
    let value: unknown = variables;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return match; // Keep placeholder if not found
      }
    }
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  });
}

/** Validate that all required variables are provided. */
export function validateVariables(
  template: Template,
  variables: Record<string, unknown>,
): string[] {
  const errors: string[] = [];
  if (!template.requiredVariables) return errors;
  for (const key of template.requiredVariables) {
    if (!(key in variables)) {
      errors.push(`Missing required variable: ${key}`);
    }
  }
  return errors;
}

// ============================================================
// Content generation
// ============================================================

export async function generateContent(request: ContentRequest): Promise<ContentResult> {
  let content = '';
  let metadata = { ...request.metadata };

  if (request.templateId) {
    const template = getTemplate(request.templateId);
    if (!template) {
      throw new Error(`Template not found: ${request.templateId}`);
    }

    const vars = { ...template.defaultVariables, ...request.variables };
    const errors = validateVariables(template, vars);
    if (errors.length > 0) {
      throw new Error(`Variable validation failed: ${errors.join('; ')}`);
    }

    content = substituteVariables(template.template, vars);
    metadata = { ...metadata, templateId: template.id, templateName: template.name };
  } else if (request.content) {
    content = request.content;
  } else {
    throw new Error('Either templateId or content must be provided');
  }

  // Format transformation
  if (request.format === 'html') {
    content = markdownToHtml(content);
  } else if (request.format === 'json') {
    content = JSON.stringify({ content, metadata }, null, 2);
  } else if (request.format === 'yaml') {
    content = toYaml({ content, metadata });
  }

  const words = content.trim().split(/\s+/).filter(Boolean);

  return {
    format: request.format,
    content,
    metadata,
    generatedAt: new Date().toISOString(),
    wordCount: words.length,
    charCount: content.length,
  };
}

// ============================================================
// Format converters
// ============================================================

/** Simple markdown to HTML converter. */
export function markdownToHtml(md: string): string {
  let html = md;

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  // Paragraphs (lines not already wrapped)
  html = html.split('\n\n').map((block) => {
    if (block.startsWith('<')) return block;
    return `<p>${block.trim()}</p>`;
  }).join('\n');

  return html;
}

/** Simple object to YAML converter (MVP — not full YAML spec). */
export function toYaml(obj: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (obj === null) return 'null';
  if (typeof obj === 'string') return obj.includes(':') ? `"${obj}"` : obj;
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (Array.isArray(obj)) {
    return obj.map((item) => `${pad}- ${toYaml(item, indent + 1)}`).join('\n');
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    return entries.map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return `${pad}${key}:\n${toYaml(value, indent + 1)}`;
      }
      return `${pad}${key}: ${toYaml(value, indent + 1)}`;
    }).join('\n');
  }
  return String(obj);
}

// ============================================================
// Content sanitization
// ============================================================

/** Strip potentially dangerous HTML tags. */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
}

/** Escape HTML special characters. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================
// Built-in templates
// ============================================================

export function registerBuiltinTemplates(): void {
  registerTemplate({
    id: 'blog-post',
    name: 'Blog Post',
    format: 'markdown',
    template: `# {{title}}

By {{author}}

{{content}}

---

*Published on {{date}}*`,
    requiredVariables: ['title', 'author', 'content'],
    defaultVariables: { date: new Date().toISOString().split('T')[0] },
  });

  registerTemplate({
    id: 'email',
    name: 'Email',
    format: 'text',
    template: `Subject: {{subject}}

Dear {{recipient}},

{{body}}

Best regards,
{{sender}}`,
    requiredVariables: ['subject', 'recipient', 'body', 'sender'],
  });

  registerTemplate({
    id: 'summary',
    name: 'Summary',
    format: 'markdown',
    template: `## Summary

{{summary}}

### Key Points

{{points}}

### Conclusion

{{conclusion}}`,
    requiredVariables: ['summary', 'points', 'conclusion'],
  });
}
