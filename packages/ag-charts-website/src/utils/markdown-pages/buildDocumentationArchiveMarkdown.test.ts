import { describe, expect, it } from 'vitest';

import { buildDocumentationArchiveMarkdown } from './buildDocumentationArchiveMarkdown';

describe('buildDocumentationArchiveMarkdown', () => {
    const output = buildDocumentationArchiveMarkdown({ siteRoot: 'https://www.ag-grid.com/' });

    it('emits frontmatter and the page H1', () => {
        expect(output.startsWith('---\n')).toBe(true);
        expect(output).toContain('title: "AG Charts Documentation Archive"');
        expect(output).toContain('\n# Documentation Archive');
    });

    it('groups releases under a major-version heading', () => {
        expect(output).toContain('## Version 14');
        expect(output).toContain('| Version | Date | Type | Documentation | Changelog |');
    });

    it('links each release to its archived docs and changelog', () => {
        // Charts always gets the /documentation suffix; the changelog carries the fixVersion.
        expect(output).toContain('[14.1.0 Documentation](https://www.ag-grid.com/charts/archive/14.1.0/documentation)');
        expect(output).toContain('[Changelog](https://www.ag-grid.com/charts/changelog/?fixVersion=14.1.0)');
    });

    it('serves older majors from the legacy charts origin', () => {
        // Majors before 10.1 archive under charts.ag-grid.com rather than www.ag-grid.com/charts.
        expect(output).toContain('## Version 9');
        expect(output).toContain('https://charts.ag-grid.com/archive/9.3.2/documentation');
    });

    it('excludes versions flagged noDocs', () => {
        // 9.1.1 and 9.0.0 are flagged noDocs and must not appear as rows.
        expect(output).not.toContain('[9.1.1 Documentation]');
        expect(output).not.toContain('[9.0.0 Documentation]');
    });

    it('ends with a single trailing newline', () => {
        expect(output.endsWith('\n')).toBe(true);
        expect(output.endsWith('\n\n')).toBe(false);
    });
});
