#!/usr/bin/env python3
"""
Multi-line aware accessibility audit.

This replaces the line-based grep in audit-accessibility.sh with a parser that
collects the full opening tag (across line breaks) before checking attributes.
"""

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
APPS_DIR = REPO_ROOT / 'apps'

VIOLATIONS = 0


def report(file: Path, line: int, rule: str, message: str) -> None:
    global VIOLATIONS
    rel = file.relative_to(REPO_ROOT)
    print(f'VIOLATION: {rel}:{line} — [{rule}] {message}')
    VIOLATIONS += 1


def find_tag_openings(content: str, tag: str) -> list[tuple[int, str]]:
    """
    Return (line_number, opening_tag_string) for each opening of `tag`.
    Handles attributes spread across multiple lines.
    """
    # pattern: <tag ... > or <tag ... />
    pattern = re.compile(rf'<{tag}\b([^>]*?(?:\n[^>]*)?)\/?>', re.IGNORECASE | re.DOTALL)
    results = []
    for match in pattern.finditer(content):
        start = match.start()
        line = content[:start].count('\n') + 1
        results.append((line, match.group(0)))
    return results


def get_text_after_opening(content: str, opening: str) -> str:
    """Return the first text node after the opening tag, if any."""
    idx = content.find(opening)
    if idx < 0:
        return ''
    after = content[idx + len(opening):]
    # Take the next text until the next < (or end of tag)
    text = re.split(r'<', after, maxsplit=1)[0]
    return text.strip()


def audit_file(file: Path, content: str) -> None:
    # 1. <img> without alt
    for line, tag in find_tag_openings(content, 'img'):
        if 'alt=' not in tag and 'role="presentation"' not in tag:
            report(file, line, 'WCAG-1.1.1', 'img without alt attribute')

    # 2. <input> without id (needed for label association)
    for line, tag in find_tag_openings(content, 'input'):
        if 'type="hidden"' in tag or 'type="submit"' in tag:
            continue
        if 'id=' not in tag and 'aria-label=' not in tag:
            report(file, line, 'WCAG-3.3.2', 'input without id or aria-label (label association)')

    # 3. <button> without text or aria-label
    for line, tag in find_tag_openings(content, 'button'):
        if 'aria-label=' in tag or 'aria-labelledby=' in tag:
            continue
        # Check if there's visible text on the same line as the opening tag
        if re.search(r'>[^<\s]', tag):
            continue
        # If the opening tag ends on the same line, check for text after it
        if tag.endswith('>'):
            text_after = get_text_after_opening(content, tag)
            if text_after:
                continue
        report(file, line, 'WCAG-4.1.2', 'button without discernible text')

    # 4. <nav> without aria-label
    for line, tag in find_tag_openings(content, 'nav'):
        if 'aria-label=' not in tag and 'aria-labelledby=' not in tag:
            report(file, line, 'WCAG-1.3.1', 'nav without aria-label')

    # 5. <section> without aria-label
    for line, tag in find_tag_openings(content, 'section'):
        if 'aria-label=' not in tag and 'aria-labelledby=' not in tag:
            report(file, line, 'WCAG-1.3.1', 'section without aria-label')


def check_layouts() -> None:
    print()
    print('=== Checking skip-to-content link (WCAG 2.4.1) ===')
    for app in ['web', 'invest', 'edu', 'console']:
        layout_dir = APPS_DIR / app / 'src' / 'layouts'
        if layout_dir.exists():
            found = False
            for f in layout_dir.rglob('*'):
                if f.is_file():
                    text = f.read_text(encoding='utf-8', errors='ignore')
                    if re.search(r'skip-to-content|skip-to-main|skip-link|Bỏ qua đến nội dung|Skip to content', text):
                        found = True
                        break
            if found:
                print(f'OK: apps/{app} — has skip-to-content link')
            else:
                print(f'VIOLATION: apps/{app}/src/layouts/ — [WCAG-2.4.1] missing skip-to-content link')

    print()
    print('=== Checking html lang attribute (WCAG 3.1.1) ===')
    for app in ['web', 'invest', 'edu', 'console']:
        layout_dir = APPS_DIR / app / 'src' / 'layouts'
        if layout_dir.exists():
            found = False
            for f in layout_dir.rglob('*'):
                if f.is_file():
                    text = f.read_text(encoding='utf-8', errors='ignore')
                    if re.search(r'<html[^>]*\s+lang=', text):
                        found = True
                        break
            if found:
                print(f'OK: apps/{app} — has lang attribute')
            else:
                print(f'VIOLATION: apps/{app}/src/layouts/ — [WCAG-3.1.1] missing lang attribute on <html>')

    print()
    print('=== Checking focus-visible styles (WCAG 2.4.7) ===')
    for app in ['web', 'invest', 'edu', 'console']:
        styles_dir = APPS_DIR / app / 'src' / 'styles'
        if styles_dir.exists():
            found = False
            for f in styles_dir.rglob('*'):
                if f.is_file():
                    text = f.read_text(encoding='utf-8', errors='ignore')
                    if re.search(r'focus-visible|\:focus', text):
                        found = True
                        break
            if found:
                print(f'OK: apps/{app} — has focus styles')
            else:
                print(f'VIOLATION: apps/{app}/src/styles/ — [WCAG-2.4.7] missing focus styles')


def main() -> None:
    print('=== WCAG 2.1 AA Accessibility Audit ===')
    print(f'Scanning: {APPS_DIR}')
    print()

    files = sorted(APPS_DIR.rglob('*.astro')) + sorted(APPS_DIR.rglob('*.tsx'))
    for file in files:
        if 'node_modules' in file.parts or 'dist' in file.parts:
            continue
        content = file.read_text(encoding='utf-8', errors='ignore')
        audit_file(file, content)

    check_layouts()

    print()
    print('=== Summary ===')
    if VIOLATIONS == 0:
        print('PASS: 0 accessibility violations found')
        sys.exit(0)
    else:
        print(f'FAIL: {VIOLATIONS} accessibility violations found')
        sys.exit(1)


if __name__ == '__main__':
    main()
