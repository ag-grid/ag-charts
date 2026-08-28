import { describe, expect, it } from 'vitest';

import galleryData from '../../../content/gallery/data.json';
import { GALLERY_FAMILY_COPY, GALLERY_PAGE_COPY } from '../galleryCopy';
import { getGalleryExamples } from './filesData';
import { MAX_TITLE_LENGTH, resolveGallerySeo } from './gallerySeo';

const EXAMPLES = getGalleryExamples({ galleryData });
const RESOLVED = EXAMPLES.map(({ exampleName, page }) => ({ exampleName, seo: resolveGallerySeo(page) }));

// Length targets bind the formula, not the hand-written copy, which has its own looser bounds.
const DERIVED = RESOLVED.filter(({ exampleName }) => !(exampleName in GALLERY_PAGE_COPY));

/** Report every offender rather than the first, so a copy pass can be done in one go. */
const offenders = (predicate: (seo: (typeof RESOLVED)[number]['seo']) => boolean) =>
    RESOLVED.filter(({ seo }) => predicate(seo)).map(({ exampleName }) => exampleName);

describe('resolveGallerySeo', () => {
    it('covers every gallery example the page fans out to', () => {
        expect(EXAMPLES.length).toBeGreaterThan(100);
        expect(RESOLVED).toHaveLength(EXAMPLES.length);
    });

    it('has a copy row for every chart family in the gallery data', () => {
        const families = new Set(galleryData.series.flat().map((series) => series.seriesName));
        const missing = [...families].filter((family) => !(family in GALLERY_FAMILY_COPY));
        expect(missing).toEqual([]);
    });

    it('has no copy rows for families or pages that no longer exist', () => {
        const families = new Set(galleryData.series.flat().map((series) => series.seriesName));
        expect(Object.keys(GALLERY_FAMILY_COPY).filter((family) => !families.has(family))).toEqual([]);

        const names = new Set(EXAMPLES.map(({ exampleName }) => exampleName));
        expect(Object.keys(GALLERY_PAGE_COPY).filter((name) => !names.has(name))).toEqual([]);
    });

    it('serves a non-empty title, H1, description and intro on every page', () => {
        expect(offenders(({ title, h1, description, intro }) => !title || !h1 || !description || !intro)).toEqual([]);
    });

    it('never serves the "AG Charts Gallery: {name}" title pattern', () => {
        expect(offenders(({ title }) => title.includes('AG Charts Gallery:'))).toEqual([]);
    });

    it('names the example intent in every title', () => {
        expect(offenders(({ title }) => !title.includes('Example'))).toEqual([]);
    });

    it('never serves a bare chart name as the H1', () => {
        const chartNames = new Set(
            galleryData.series.flat().flatMap((series) => series.examples.map((example) => example.title))
        );
        expect(offenders(({ h1 }) => chartNames.has(h1))).toEqual([]);
        expect(offenders(({ h1 }) => !h1.endsWith('Example'))).toEqual([]);
    });

    it('drops the title hook rather than overflowing, where dropping it is enough', () => {
        const tooLong = DERIVED.filter(
            ({ seo }) => seo.title.length > MAX_TITLE_LENGTH && seo.title !== `${seo.h1} | AG Charts`
        ).map(({ exampleName }) => exampleName);
        expect(tooLong).toEqual([]);
    });

    it('lands every derived meta description in the 140-155 character band', () => {
        const outOfBand = DERIVED.filter(({ seo }) => seo.description.length < 140 || seo.description.length > 155).map(
            ({ exampleName, seo }) => `${exampleName} (${seo.description.length})`
        );
        expect(outOfBand).toEqual([]);
    });

    it('keeps the hand-written descriptions within a length search results will show', () => {
        expect(offenders(({ description }) => description.length < 120 || description.length > 170)).toEqual([]);
    });

    it('names the chart type and the frameworks in every intro', () => {
        expect(offenders(({ intro }) => !intro.startsWith('This example shows '))).toEqual([]);
        expect(offenders(({ intro }) => !intro.includes('JavaScript, React, Angular or Vue'))).toEqual([]);
    });

    it('never doubles the word Chart', () => {
        expect(offenders(({ title, description, intro }) => /Chart Chart/i.test(title + description + intro))).toEqual(
            []
        );
    });

    it('resolves distinct titles per page, so no two pages compete for the same result', () => {
        const titles = RESOLVED.map(({ seo }) => seo.title);
        expect(new Set(titles).size).toBe(titles.length);
    });
});

describe('the hand-written page copy', () => {
    it('is used verbatim where supplied', () => {
        const seo = resolveGallerySeo(EXAMPLES.find(({ exampleName }) => exampleName === 'simple-bar')!.page);
        expect(seo.title).toBe('Bar Chart Example - JavaScript Data Visualization | AG Charts');
        expect(seo.h1).toBe('Bar Chart Example');
        expect(seo.description).toContain('An interactive bar chart built with AG Charts: compare categories');
    });
});

describe('the derived page copy', () => {
    const seoFor = (exampleName: string) =>
        resolveGallerySeo(EXAMPLES.find((example) => example.exampleName === exampleName)!.page);

    it('drops the "Simple" the gallery grid uses to disambiguate siblings', () => {
        expect(seoFor('simple-horizontal-bar').h1).toBe('Horizontal Bar Chart Example');
    });

    it('reads the chart name mid-sentence without flattening initialisms', () => {
        expect(seoFor('ohlc').intro).toContain('an OHLC chart built with AG Charts');
        expect(seoFor('bubble-with-custom-svg-patterns').intro).toContain('bubble chart with custom SVG patterns');
        expect(seoFor('100--stacked-area').intro).toContain('a 100% stacked area chart');
    });

    it("takes its wording from the example's own chart family", () => {
        expect(seoFor('sankey-customisation').intro).toContain('proportionally sized links');
        expect(seoFor('horizontal-box-plot').description).toContain('quartiles, medians, whiskers');
    });

    it('throws when a chart family has no copy row', () => {
        expect(() =>
            resolveGallerySeo({
                title: 'Mystery Chart',
                name: 'mystery',
                seriesTitle: 'Mystery',
                chartSeriesName: 'mystery',
            })
        ).toThrow(/No gallery copy for chart family "mystery"/);
    });
});
