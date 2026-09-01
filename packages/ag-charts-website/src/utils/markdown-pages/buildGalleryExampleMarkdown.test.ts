import { getGalleryExamples } from '@components/gallery/utils/filesData';
import { resolveGallerySeo } from '@components/gallery/utils/gallerySeo';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import galleryData from '../../content/gallery/data.json';
import { buildGalleryExampleMarkdown } from './buildGalleryExampleMarkdown';

const SITE_ROOT = 'https://www.ag-grid.com/';
const DIST = join(__dirname, '../../../../../dist/packages/ag-charts-website');

// The real gallery entries, so a chart type with no docs page shows up here, not in a broken twin.
const EXAMPLES = getGalleryExamples({ galleryData });

const buildFor = (exampleName: string) => {
    const entry = EXAMPLES.find((example) => example.exampleName === exampleName);
    expect(entry, `${exampleName} should be in the gallery data`).toBeDefined();
    const { page, relatedExamples } = entry!;
    return buildGalleryExampleMarkdown({
        page,
        exampleName,
        relatedExamples,
        siteRoot: SITE_ROOT,
    });
};

describe('buildGalleryExampleMarkdown', () => {
    it('covers every gallery example the page fans out to', () => {
        expect(EXAMPLES.length).toBeGreaterThan(100);
        expect(new Set(EXAMPLES.map((example) => example.exampleName)).size).toBe(EXAMPLES.length);
    });

    it("emits frontmatter, heading and intro matching the page's own copy", async () => {
        const { page } = EXAMPLES.find((example) => example.exampleName === 'simple-bar')!;
        const seo = resolveGallerySeo(page);
        const output = await buildFor('simple-bar');

        expect(output.startsWith('---\n')).toBe(true);
        expect(output).toContain(`title: ${JSON.stringify(seo.title)}`);
        expect(output).toContain(`description: ${JSON.stringify(seo.description)}`);
        expect(output).toContain(`\n# ${seo.h1}`);
        expect(output).toContain(seo.intro);
    });

    it('names the chart type and links its documentation page', async () => {
        const output = await buildFor('simple-bar');
        expect(output).toContain('Chart type: Bar');
        expect(output).toContain('[View Bar Charts Documentation](https://www.ag-grid.com/javascript/bar-series/)');
    });

    it('flags an enterprise chart type, as the page does with its enterprise icon', async () => {
        const output = await buildFor('simple-sunburst');
        expect(output).toContain('Chart type: Sunburst (Enterprise)');
    });

    it('links the runnable example', async () => {
        const output = await buildFor('simple-bar');
        expect(output).toContain('[Run this example](https://www.ag-grid.com/gallery/examples/simple-bar/)');
    });

    it('anchors each related example on the H1 its page serves', async () => {
        const entry = EXAMPLES.find((example) => example.exampleName === 'simple-bar')!;
        const output = await buildFor('simple-bar');
        expect(entry.relatedExamples.length).toBeGreaterThan(0);
        for (const related of entry.relatedExamples) {
            expect(output).toContain(`- [${related.label}](https://www.ag-grid.com/gallery/${related.name}/)`);
        }
        expect(output).toContain('- [Stacked Bar Chart Example](https://www.ag-grid.com/gallery/stacked-bar/)');
    });

    it('names the chart family when every related example is a sibling', async () => {
        const output = await buildFor('simple-bar');
        expect(output).toContain('## More Bar Chart Examples');
    });

    it('falls back to a generic heading where the family is too small to fill the strip', async () => {
        const output = await buildFor('ohlc');
        expect(output).toContain('## More Chart Examples');
    });

    it("links the family's section on the gallery hub", async () => {
        const output = await buildFor('simple-bar');
        expect(output).toContain('[View all Bar Charts](https://www.ag-grid.com/gallery/#bar)');
    });

    it('ends with a single trailing newline', async () => {
        const output = await buildFor('simple-bar');
        expect(output.endsWith('\n')).toBe(true);
        expect(output.endsWith('\n\n')).toBe(false);
    });
});

// Asserted against a real build's twins: the unit-test target does not run `generate-examples`.
describe.runIf(existsSync(join(DIST, 'gallery/simple-bar.md')))('the built gallery twins', () => {
    const builtTwin = (exampleName: string) => readFileSync(join(DIST, `gallery/${exampleName}.md`), 'utf8');

    it('inlines the example source with the generator harness stripped', () => {
        const output = builtTwin('simple-bar');
        expect(output).toContain('## Source');
        expect(output).toContain('```js\n');
        expect(output).toContain('AgCharts.create(options)');
        // The dark-mode and e2e-theme harness the generator injects must not leak through.
        expect(output).not.toContain('DARK MODE START');
        expect(output).not.toContain('E2E THEME START');
    });

    it('links the data module the source reads rather than inlining it', () => {
        expect(builtTwin('simple-bar')).toContain('/gallery/examples/simple-bar/data.js)');
    });

    it('leaves the bulky data out of the twin itself', () => {
        // This example's data module alone is ~60KB of coordinates.
        expect(builtTwin('scatter-with-large-data').length).toBeLessThan(20_000);
    });

    it('emits a twin for every gallery example the page fans out to', () => {
        const missing = EXAMPLES.filter(({ exampleName }) => !existsSync(join(DIST, `gallery/${exampleName}.md`))).map(
            ({ exampleName }) => exampleName
        );
        expect(missing).toEqual([]);
    });
});
