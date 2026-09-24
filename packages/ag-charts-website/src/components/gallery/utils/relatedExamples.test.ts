import { describe, expect, it } from 'vitest';

import galleryData from '../../../content/gallery/data.json';
import { getGalleryExamples } from './filesData';
import { resolveGallerySeo } from './gallerySeo';
import {
    type RelatedGalleryData,
    getFamilyExamples,
    getRelatedExamples,
    relatedExamplesHeading,
} from './relatedExamples';

const EXAMPLES = getGalleryExamples({ galleryData });
const FAMILIES = galleryData.series.flat();

const visibleNames = (seriesName: string) =>
    FAMILIES.find((family) => family.seriesName === seriesName)!
        .examples.filter(({ hidden }) => hidden !== true)
        .map(({ name }) => name);

/** Two families of real examples, the second holding one, so topping it up has to wrap round. */
const WRAPPING_GALLERY: RelatedGalleryData = {
    series: [
        [
            { title: 'Bar', seriesName: 'bar', examples: visibleNames('bar').map((name) => ({ title: name, name })) },
            { title: 'Pie', seriesName: 'pie', examples: [{ title: 'simple-pie', name: 'simple-pie' }] },
        ],
    ],
};

describe('getRelatedExamples', () => {
    it('links at least six examples from every gallery page', () => {
        const short = EXAMPLES.filter(({ relatedExamples }) => relatedExamples.length < 6).map(
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

    it('links every sibling before topping the strip up', () => {
        const related = getRelatedExamples({ galleryData, exampleName: 'simple-bar' });
        const siblings = visibleNames('bar').filter((name) => name !== 'simple-bar');

        expect(related.map(({ name }) => name)).toEqual([...siblings, 'simple-line']);
        expect(related.map(({ isFamilySibling }) => isFamilySibling)).toEqual([...siblings.map(() => true), false]);
    });

    it('links only siblings where the family alone fills the strip', () => {
        const related = getRelatedExamples({ galleryData, exampleName: 'bar-line-combination' });

        expect(related.map(({ name }) => name)).toEqual(
            visibleNames('combination').filter((name) => name !== 'bar-line-combination')
        );
        expect(related.every(({ isFamilySibling }) => isFamilySibling)).toBe(true);
    });

    it('fills the remaining slots from the families that follow, in gallery order', () => {
        const related = getRelatedExamples({ galleryData, exampleName: 'chord' });

        expect(related.map(({ name }) => name)).toEqual([
            'chord-customisation',
            'simple-funnel',
            'customised-funnel',
            'simple-cone-funnel',
            'simple-pyramid',
            'simple-radial-gauge',
        ]);
    });

    it('fills the whole strip from the next family where a family holds a single example', () => {
        expect(visibleNames('ohlc')).toEqual(['ohlc']);

        const related = getRelatedExamples({ galleryData, exampleName: 'ohlc' });
        expect(related.map(({ name }) => name)).toEqual([
            'simple-radar-line',
            'radar-with-markers',
            'reversed-radar-with-markers',
            'simple-radar-area',
            'radar-area-with-labels',
            'reversed-radar-area',
        ]);
        expect(related.some(({ isFamilySibling }) => isFamilySibling)).toBe(false);
    });

    it('wraps round to the first family when topping up the last one', () => {
        const related = getRelatedExamples({ galleryData: WRAPPING_GALLERY, exampleName: 'simple-pie' });

        expect(related.map(({ name }) => name)).toEqual(visibleNames('bar'));
    });

    it('anchors each link on the H1 the target page serves', () => {
        const h1ByName = new Map(EXAMPLES.map(({ exampleName }) => [exampleName, resolveGallerySeo(exampleName).h1]));
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
