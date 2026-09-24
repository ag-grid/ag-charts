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
    /** `name` is the example's key, which the card's thumbnail is resolved from. */
    examples: { label: string; name: string; url: string }[];
}

/** Slots a strip aims to fill: four cards show at once, so six always leaves somewhere to scroll to. */
const MIN_RELATED_EXAMPLES = 6;

function visibleExamples(family: RelatedGalleryFamily) {
    return family.examples.filter(({ hidden }) => hidden !== true);
}

function findFamily(galleryData: RelatedGalleryData, exampleName: string) {
    return galleryData.series.flat().find((family) => visibleExamples(family).some(({ name }) => name === exampleName));
}

/** The families after this one in `data.json`, wrapping round to the first and stopping short of it. */
function familiesAfter(galleryData: RelatedGalleryData, family: RelatedGalleryFamily) {
    const families = galleryData.series.flat();
    const position = families.indexOf(family);
    return [...families.slice(position + 1), ...families.slice(0, position)];
}

/**
 * The examples a gallery page links as related: every sibling in its own chart family, then the
 * families that follow it until the strip holds {@link MIN_RELATED_EXAMPLES}. Families share no
 * example, so topping up cannot repeat one.
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

    const toRelated = (example: { name: string }, isFamilySibling: boolean) => ({
        label: resolveGalleryH1(example.name),
        name: example.name,
        isFamilySibling,
    });

    const siblings = visibleExamples(family).filter(({ name }) => name !== exampleName);
    const shortfall = MIN_RELATED_EXAMPLES - siblings.length;
    const topUp = familiesAfter(galleryData, family).flatMap(visibleExamples).slice(0, Math.max(shortfall, 0));

    return [
        ...siblings.map((sibling) => toRelated(sibling, true)),
        ...topUp.map((example) => toRelated(example, false)),
    ];
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
            label: resolveGalleryH1(example.name),
            name: example.name,
            url: getPageUrl(example.name),
        })),
    };
}
