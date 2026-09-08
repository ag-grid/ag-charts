import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import galleryData from '../../../content/gallery/data.json';
import { GALLERY_EXAMPLE_COPY, GALLERY_HUB_COPY } from '../galleryCopy';
import { getGalleryExamples } from './filesData';
import { galleryFamilyHeading, galleryFamilyName, resolveGalleryH1, resolveGallerySeo } from './gallerySeo';

const EXAMPLES = getGalleryExamples({ galleryData });
const RESOLVED = EXAMPLES.map(({ exampleName }) => ({ exampleName, seo: resolveGallerySeo(exampleName) }));

/**
 * The copy is hand-written, so these are editorial bounds rather than a formula's output: a title
 * or description outside them is one search results will truncate.
 */
const MAX_TITLE_LENGTH = 80;
const MIN_DESCRIPTION_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 170;

/** Report every offender rather than the first, so a copy pass can be done in one go. */
const offenders = (predicate: (seo: (typeof RESOLVED)[number]['seo']) => boolean) =>
    RESOLVED.filter(({ seo }) => predicate(seo)).map(({ exampleName }) => exampleName);

describe('resolveGallerySeo', () => {
    it('covers every gallery example the page fans out to', () => {
        expect(EXAMPLES.length).toBeGreaterThan(100);
        expect(RESOLVED).toHaveLength(EXAMPLES.length);
    });

    it('has a copy row for every example, and none left behind for one that has gone', () => {
        const names = new Set(EXAMPLES.map(({ exampleName }) => exampleName));
        expect([...names].filter((name) => !(name in GALLERY_EXAMPLE_COPY))).toEqual([]);
        expect(Object.keys(GALLERY_EXAMPLE_COPY).filter((name) => !names.has(name))).toEqual([]);
    });

    it('serves a non-empty title, H1, description and intro on every page', () => {
        expect(offenders(({ title, h1, description, intro }) => !title || !h1 || !description || !intro)).toEqual([]);
    });

    it('never serves the "AG Charts Gallery: {name}" title pattern', () => {
        expect(offenders(({ title }) => title.includes('AG Charts Gallery:'))).toEqual([]);
    });

    it('never serves a bare chart name as the H1', () => {
        const chartNames = new Set(
            galleryData.series.flat().flatMap((series) => series.examples.map((example) => example.title))
        );
        expect(offenders(({ h1 }) => chartNames.has(h1))).toEqual([]);
        expect(offenders(({ h1 }) => !h1.endsWith('Example'))).toEqual([]);
    });

    it('keeps every title within a length search results will show', () => {
        expect(offenders(({ title }) => title.length > MAX_TITLE_LENGTH)).toEqual([]);
    });

    it('keeps every meta description within a length search results will show', () => {
        expect(
            offenders(
                ({ description }) =>
                    description.length < MIN_DESCRIPTION_LENGTH || description.length > MAX_DESCRIPTION_LENGTH
            )
        ).toEqual([]);
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

    it('links intros only through /r/, to docs pages that exist', () => {
        const docsPages = new Set(
            readdirSync(new URL('../../../content/docs', import.meta.url), { withFileTypes: true })
                .filter((entry) => entry.isDirectory())
                .map((entry) => entry.name)
        );
        const problems = RESOLVED.flatMap(({ exampleName, seo }) =>
            [...seo.intro.matchAll(/\]\(([^)]+)\)/g)]
                .map(([, href]) => href)
                // `/r/` keeps the link framework-agnostic, as the gallery itself is.
                .filter((href) => !/^\/r\/[^/]+\/$/.test(href) || !docsPages.has(href.split('/')[2]))
                .map((href) => `${exampleName} -> ${href}`)
        );
        expect(problems).toEqual([]);
    });

    it('throws when an example has no copy row', () => {
        expect(() => resolveGallerySeo('mystery')).toThrow(/No gallery copy for example "mystery"/);
    });
});

describe('the gallery hub copy', () => {
    it('keeps the title within a length search results will show', () => {
        expect(GALLERY_HUB_COPY.title.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
    });

    it('lands the meta description in the 140-155 character band', () => {
        expect(GALLERY_HUB_COPY.description.length).toBeGreaterThanOrEqual(140);
        expect(GALLERY_HUB_COPY.description.length).toBeLessThanOrEqual(155);
    });

    it('names the gallery in the title and the H1', () => {
        expect(GALLERY_HUB_COPY.title).toContain('AG Charts Gallery');
        expect(GALLERY_HUB_COPY.h1).toContain('AG Charts Gallery');
    });

    it('links more examples than the "100+" the copy claims', () => {
        const visible = galleryData.series
            .flat()
            .flatMap((series) => series.examples)
            .filter((example) => !example.hidden);
        expect(visible.length).toBeGreaterThan(100);
    });
});

describe('galleryFamilyName', () => {
    it('names a family in the singular', () => {
        expect(galleryFamilyName('Bar')).toBe('Bar Chart');
        expect(galleryFamilyName('OHLC')).toBe('OHLC Chart');
    });

    it('does not repeat a family name that already says Chart', () => {
        expect(galleryFamilyName('Org Chart')).toBe('Org Chart');
        const families = galleryData.series.flat().map((series) => galleryFamilyName(series.title));
        expect(families.filter((name) => /Chart Chart/.test(name))).toEqual([]);
    });
});

describe('galleryFamilyHeading', () => {
    it('pluralises a family name into a heading', () => {
        expect(galleryFamilyHeading('Bar')).toBe('Bar Charts');
        expect(galleryFamilyHeading('OHLC')).toBe('OHLC Charts');
    });

    it('does not repeat a family name that already says Chart', () => {
        expect(galleryFamilyHeading('Org Chart')).toBe('Org Charts');
        const families = galleryData.series.flat().map((series) => galleryFamilyHeading(series.title));
        expect(families.filter((heading) => /Chart Charts/.test(heading))).toEqual([]);
    });
});

describe('resolveGalleryH1', () => {
    it('resolves the same H1 the page serves, for every example', () => {
        const disagree = EXAMPLES.filter(
            ({ exampleName }) => resolveGalleryH1(exampleName) !== resolveGallerySeo(exampleName).h1
        );
        expect(disagree).toEqual([]);
    });

    it('drops the "Simple" the gallery grid uses to disambiguate siblings', () => {
        expect(resolveGalleryH1('simple-horizontal-bar')).toBe('Horizontal Bar Chart Example');
    });
});
