import { getGalleryExamples } from '@components/gallery/utils/filesData';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import galleryData from '../../content/gallery/data.json';
import { buildGalleryExampleMarkdown, galleryExampleDescription } from './buildGalleryExampleMarkdown';

const SITE_ROOT = 'https://www.ag-grid.com/';
const DIST = join(__dirname, '../../../../../dist/packages/ag-charts-website');

// The real gallery entries the pages render, so a chart type added without a docs page or a
// mis-shaped entry shows up here rather than in a broken twin.
const EXAMPLES = getGalleryExamples({ galleryData });

const buildFor = (exampleName: string) => {
    const entry = EXAMPLES.find((example) => example.exampleName === exampleName);
    expect(entry, `${exampleName} should be in the gallery data`).toBeDefined();
    const { page, prevExample, nextExampleOne, nextExampleTwo } = entry!;
    return buildGalleryExampleMarkdown({
        page,
        exampleName,
        neighbours: [prevExample, nextExampleOne, nextExampleTwo],
        siteRoot: SITE_ROOT,
    });
};

describe('buildGalleryExampleMarkdown', () => {
    it('covers every gallery example the page fans out to', () => {
        expect(EXAMPLES.length).toBeGreaterThan(100);
        expect(new Set(EXAMPLES.map((example) => example.exampleName)).size).toBe(EXAMPLES.length);
    });

    it("emits frontmatter matching the page's title and description", async () => {
        const output = await buildFor('simple-bar');
        expect(output.startsWith('---\n')).toBe(true);
        expect(output).toContain('title: "AG Charts Gallery: Bar Chart"');
        expect(output).toContain(
            `description: ${JSON.stringify(
                galleryExampleDescription({
                    title: 'Bar Chart',
                    name: 'simple-bar',
                    seriesTitle: 'Bar',
                })
            )}`
        );
        expect(output).toContain('\n# Bar Chart');
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

    it('links the three neighbouring examples the page links to', async () => {
        const entry = EXAMPLES.find((example) => example.exampleName === 'simple-bar')!;
        const output = await buildFor('simple-bar');
        for (const neighbour of [entry.prevExample, entry.nextExampleOne, entry.nextExampleTwo]) {
            expect(output).toContain(`- [${neighbour.title}](https://www.ag-grid.com/gallery/${neighbour.name}/)`);
        }
    });

    it('ends with a single trailing newline', async () => {
        const output = await buildFor('simple-bar');
        expect(output.endsWith('\n')).toBe(true);
        expect(output.endsWith('\n\n')).toBe(false);
    });
});

// The example source is read from the `generate-examples` output, which the unit-test target does
// not build — so it is asserted against the twins a real build emitted instead. Requires
// `nx build ag-charts-website`; skipped otherwise so unit runs stay fast.
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
        // This example's data module alone is ~60KB of coordinates; the twin must not carry it.
        expect(builtTwin('scatter-with-large-data').length).toBeLessThan(20_000);
    });

    it('emits a twin for every gallery example the page fans out to', () => {
        const missing = EXAMPLES.filter(({ exampleName }) => !existsSync(join(DIST, `gallery/${exampleName}.md`))).map(
            ({ exampleName }) => exampleName
        );
        expect(missing).toEqual([]);
    });
});
