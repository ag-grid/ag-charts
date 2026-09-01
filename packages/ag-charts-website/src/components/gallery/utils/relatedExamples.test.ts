import { describe, expect, it } from 'vitest';

import galleryData from '../../../content/gallery/data.json';
import { getGalleryExamples } from './filesData';
import { resolveGallerySeo } from './gallerySeo';
import { getFamilyExamples, getRelatedExamples, relatedExamplesHeading } from './relatedExamples';

const EXAMPLES = getGalleryExamples({ galleryData });
const FAMILIES = galleryData.series.flat();

const visibleNames = (seriesName: string) =>
    FAMILIES.find((family) => family.seriesName === seriesName)!
        .examples.filter(({ hidden }) => hidden !== true)
        .map(({ name }) => name);

describe('getRelatedExamples', () => {
    it('links at least three examples from every gallery page', () => {
        const short = EXAMPLES.filter(({ relatedExamples }) => relatedExamples.length < 3).map(
            ({ exampleName }) => exampleName
        );
        expect(short).toEqual([]);
    });

    it('never links a page to itself', () => {
        const selfLinking = EXAMPLES.filter(({ exampleName, relatedExamples }) =>
            relatedExamples.some(({ name }) => name === exampleName)
        ).map(({ exampleName }) => exampleName);
        expect(selfLinking).toEqual([]);
    });

    it('links no example twice', () => {
        const duplicated = EXAMPLES.filter(
            ({ relatedExamples }) => new Set(relatedExamples.map(({ name }) => name)).size !== relatedExamples.length
        ).map(({ exampleName }) => exampleName);
        expect(duplicated).toEqual([]);
    });

    it('links every sibling, and only siblings, where the family can fill the strip', () => {
        const related = getRelatedExamples({ galleryData, exampleName: 'simple-bar' });
        expect(related.map(({ name }) => name)).toEqual(visibleNames('bar').filter((name) => name !== 'simple-bar'));
        expect(related.every(({ isFamilySibling }) => isFamilySibling)).toBe(true);
    });

    it('tops up where a family holds a single example', () => {
        expect(visibleNames('ohlc')).toEqual(['ohlc']);
        const related = getRelatedExamples({ galleryData, exampleName: 'ohlc' });
        expect(related).toHaveLength(3);
        expect(related.some(({ isFamilySibling }) => isFamilySibling)).toBe(false);
    });

    it('tops up from the family a one-example family specialises', () => {
        const names = (exampleName: string) => getRelatedExamples({ galleryData, exampleName }).map(({ name }) => name);
        expect(names('ohlc')).toContain('candlestick-hollow');
        expect(names('simple-cone-funnel')).toEqual(expect.arrayContaining(['customised-funnel', 'simple-funnel']));
        expect(names('simple-pyramid')).toContain('simple-cone-funnel');
    });

    it('keeps the siblings it has when topping a small family up', () => {
        const related = getRelatedExamples({ galleryData, exampleName: 'candlestick' });
        const siblings = visibleNames('candlestick').filter((name) => name !== 'candlestick');
        expect(related.filter(({ isFamilySibling }) => isFamilySibling).map(({ name }) => name)).toEqual(siblings);
        expect(related).toHaveLength(3);
    });

    it('prefers a group-mate over an unrelated family when topping up', () => {
        const related = getRelatedExamples({ galleryData, exampleName: 'simple-radar-line' });
        const groupMates = new Set(visibleNames('radar-area'));
        expect(related).toHaveLength(3);
        expect(related.filter(({ name }) => groupMates.has(name))).toHaveLength(1);
    });

    it('anchors each link on the H1 the target page serves', () => {
        const h1ByName = new Map(EXAMPLES.map(({ exampleName, page }) => [exampleName, resolveGallerySeo(page).h1]));
        const mismatched = EXAMPLES.flatMap(({ exampleName, relatedExamples }) =>
            relatedExamples
                .filter(({ label, name }) => label !== h1ByName.get(name))
                .map(({ name }) => `${exampleName} -> ${name}`)
        );
        expect(mismatched).toEqual([]);
    });

    it('returns nothing for an example that is not in the gallery', () => {
        expect(getRelatedExamples({ galleryData, exampleName: 'not-a-chart' })).toEqual([]);
    });
});

describe('relatedExamplesHeading', () => {
    const related = (isFamilySibling: boolean) => [{ label: 'Bar Chart Example', name: 'simple-bar', isFamilySibling }];

    it('names the chart family when every link is a sibling', () => {
        expect(relatedExamplesHeading({ seriesTitle: 'Bar', related: related(true) })).toBe('More Bar Chart Examples');
        expect(relatedExamplesHeading({ seriesTitle: 'Org Chart', related: related(true) })).toBe(
            'More Org Chart Examples'
        );
    });

    it('stays generic once a link comes from outside the family', () => {
        expect(relatedExamplesHeading({ seriesTitle: 'OHLC', related: related(false) })).toBe('More Chart Examples');
    });

    it('stays generic with nothing to link', () => {
        expect(relatedExamplesHeading({ seriesTitle: 'Bar', related: [] })).toBe('More Chart Examples');
    });
});

describe('getFamilyExamples', () => {
    it('links every visible example in the family, on the H1 its page serves', () => {
        const family = getFamilyExamples({ galleryData, seriesName: 'bar' });
        expect(family.title).toBe('Bar');
        expect(family.examples.map(({ url }) => url)).toEqual(visibleNames('bar').map((name) => `/gallery/${name}/`));
        expect(family.examples[0].label).toBe('Bar Chart Example');
    });

    it('covers every gallery example across the families the docs pages render', () => {
        const linked = new Set(
            FAMILIES.flatMap(({ seriesName }) =>
                getFamilyExamples({ galleryData, seriesName }).examples.map(({ url }) => url)
            )
        );
        const missing = EXAMPLES.filter(({ exampleName }) => !linked.has(`/gallery/${exampleName}/`)).map(
            ({ exampleName }) => exampleName
        );
        expect(missing).toEqual([]);
    });

    it("points at the family's section on the gallery hub", () => {
        expect(getFamilyExamples({ galleryData, seriesName: 'bar' }).hubUrl).toBe('/gallery/#bar');
    });

    it('throws on a chart family that does not exist', () => {
        expect(() => getFamilyExamples({ galleryData, seriesName: 'not-a-family' })).toThrow(/not-a-family/);
    });
});
