import { galleryFamilyName, resolveGalleryH1 } from './gallerySeo';
import { getPageHashUrl, getPageUrl } from './urlPaths';

/** The slice of the gallery collection related-link resolution reads. */
export interface RelatedGalleryFamily {
    /** Family display name, e.g. `Bar`. */
    title: string;
    /** Family key, which is also its section id on the gallery hub. */
    seriesName: string;
    examples: { title: string; name: string; hidden?: boolean }[];
}

export interface RelatedGalleryData {
    series: RelatedGalleryFamily[][];
}

/** A related example, as a gallery page's strip and its `.md` twin link it. */
export interface GalleryRelatedExample {
    /** The H1 the target page serves, so a link and its destination name the example identically. */
    label: string;
    name: string;
    /** Whether it shares the page's chart family, which decides how the strip is headed. */
    isFamilySibling: boolean;
}

/** Every example in one chart family, as a docs page's gallery section links them. */
export interface GalleryFamilyExamples {
    title: string;
    /** The family's section on the gallery hub. */
    hubUrl: string;
    examples: { label: string; url: string }[];
}

/** Fewest links a strip carries: three families hold one example, so siblings alone leave them empty. */
const MIN_RELATED_EXAMPLES = 3;

function visibleExamples(family: RelatedGalleryFamily) {
    return family.examples.filter(({ hidden }) => hidden !== true);
}

function findFamily(galleryData: RelatedGalleryData, exampleName: string) {
    return galleryData.series.flat().find((family) => visibleExamples(family).some(({ name }) => name === exampleName));
}

/**
 * Every other example by distance from this one, preceding side first: `data.json` keeps related
 * families adjacent, and a one-example family usually specialises the one before it.
 */
function examplesNearest(galleryData: RelatedGalleryData, exampleName: string) {
    const allExamples = galleryData.series.flat().flatMap(visibleExamples);
    const position = allExamples.findIndex(({ name }) => name === exampleName);
    const at = (offset: number) => allExamples[(position + offset + allExamples.length) % allExamples.length];

    const nearest = [];
    for (let distance = 1; distance < allExamples.length; distance++) {
        nearest.push(at(-distance), at(distance));
    }
    return nearest;
}

/**
 * The examples a gallery page links as related: every sibling in its own chart family, topped up —
 * only where the family is too small to fill the strip — from the rest of its group in `data.json`
 * and then from its nearest neighbours in the gallery.
 */
export function getRelatedExamples({
    galleryData,
    exampleName,
}: {
    galleryData: RelatedGalleryData;
    exampleName: string;
}): GalleryRelatedExample[] {
    const family = findFamily(galleryData, exampleName);
    if (!family) {
        return [];
    }

    const toRelated = (example: { title: string; name: string }, isFamilySibling: boolean) => ({
        label: resolveGalleryH1(example),
        name: example.name,
        isFamilySibling,
    });

    const related = visibleExamples(family)
        .filter(({ name }) => name !== exampleName)
        .map((sibling) => toRelated(sibling, true));
    if (related.length >= MIN_RELATED_EXAMPLES) {
        return related;
    }

    const group = galleryData.series.find((families) => families.includes(family)) ?? [family];
    const topUp = [...group.flatMap(visibleExamples), ...examplesNearest(galleryData, exampleName)];

    const linked = new Set([exampleName, ...related.map(({ name }) => name)]);
    for (const example of topUp) {
        if (related.length >= MIN_RELATED_EXAMPLES) {
            break;
        }
        if (linked.has(example.name)) {
            continue;
        }
        linked.add(example.name);
        related.push(toRelated(example, false));
    }

    return related;
}

/** Names the chart family only when every related link is one of its siblings. */
export function relatedExamplesHeading({
    seriesTitle,
    related,
}: {
    seriesTitle: string;
    related: GalleryRelatedExample[];
}): string {
    const allSiblings = related.length > 0 && related.every(({ isFamilySibling }) => isFamilySibling);
    return allSiblings ? `More ${galleryFamilyName(seriesTitle)} Examples` : 'More Chart Examples';
}

/**
 * Every example in a chart family, for the gallery section a docs page renders. Throws on an
 * unknown family so a mistyped `series` attribute fails the build rather than rendering nothing.
 */
export function getFamilyExamples({
    galleryData,
    seriesName,
}: {
    galleryData: RelatedGalleryData;
    seriesName: string;
}): GalleryFamilyExamples {
    const family = galleryData.series.flat().find((candidate) => candidate.seriesName === seriesName);
    if (!family) {
        throw new Error(`No gallery chart family "${seriesName}". Use a seriesName from content/gallery/data.json.`);
    }

    return {
        title: family.title,
        hubUrl: getPageHashUrl({ chartSeriesName: family.seriesName }),
        examples: visibleExamples(family).map((example) => ({
            label: resolveGalleryH1(example),
            url: getPageUrl(example.name),
        })),
    };
}
