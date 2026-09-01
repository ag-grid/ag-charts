import { GALLERY_FAMILY_COPY, GALLERY_PAGE_COPY, type GalleryFamilyCopy } from '../galleryCopy';

/**
 * The gallery entry `resolveGallerySeo` needs, as `getGalleryExamples` builds it. A subset of the
 * props the page receives, so the `.md` twin can resolve the same copy without the page's extras.
 */
export interface GallerySeoPage {
    /** Example title from `data.json`, e.g. `Stacked Bar Chart`. */
    title: string;
    name: string;
    /** Chart family display name, e.g. `Bar`. */
    seriesTitle: string;
    /** Chart family key, matching a row in `GALLERY_FAMILY_COPY`. */
    chartSeriesName: string;
}

export interface GallerySeo {
    /** `<title>`, which `Layout.astro` also feeds to the OG and Twitter title tags. */
    title: string;
    /** The page's `<h1>`. */
    h1: string;
    /** Meta description, which `Layout.astro` also feeds to the OG and Twitter description tags. */
    description: string;
    /** Indexable body copy, rendered directly under the H1. */
    intro: string;
}

/**
 * Longest derived title that keeps its keyword hook, matching the longest of the hand-written
 * titles. At 60 the hook survives on only five pages, because the example names are already long.
 */
export const MAX_TITLE_LENGTH = 63;

/** The band the derived meta description aims for; the closest-fitting tail wins. */
const META_TARGET_MIN = 140;
const META_TARGET_MAX = 155;

/**
 * Meta-description endings, longest first, paired with the lead-ins below to hit the target band.
 * `AG Charts` appears in every lead-in or tail, so the brand survives whichever pair wins.
 */
const META_TAILS = [
    'Explore the live JavaScript example and copy the code.',
    'Explore the live example and copy the code.',
    'Explore the live AG Charts example.',
    'Live AG Charts example.',
] as const;

/** Frameworks the intro names, in the order the framework links render. */
export const GALLERY_INTRO_FRAMEWORKS = 'JavaScript, React, Angular or Vue';

/**
 * `Simple` distinguishes an example from its siblings in the gallery grid but adds nothing to a
 * page title, so it is dropped from the H1: `Simple Horizontal Bar Chart` reads as
 * `Horizontal Bar Chart Example`.
 */
function withoutSimplePrefix(title: string): string {
    return title.replace(/^Simple /, '');
}

/**
 * The H1 an example page serves, which is also its anchor text on the hub and in the `.md` twin, so
 * that a link and its destination name the example identically.
 */
export function resolveGalleryH1(page: Pick<GallerySeoPage, 'title' | 'name'>): string {
    return GALLERY_PAGE_COPY[page.name]?.seoH1 ?? `${withoutSimplePrefix(page.title)} Example`;
}

/** A chart family named in the singular, from its `title` in `data.json`: `Bar` reads as `Bar Chart`. */
export function galleryFamilyName(title: string): string {
    return title.endsWith('Chart') ? title : `${title} Chart`;
}

/** Heading for a chart family, from its `title` in `data.json`: `Bar` reads as `Bar Charts`. */
export function galleryFamilyHeading(title: string): string {
    return `${galleryFamilyName(title)}s`;
}

/**
 * Lowercase a title for use mid-sentence, leaving initialisms (`OHLC`, `SVG`) and numeric tokens
 * (`100%`) as they are.
 */
function toProse(title: string): string {
    return title
        .split(' ')
        .map((word) => (/[0-9]/.test(word) || word === word.toUpperCase() ? word : word.toLowerCase()))
        .join(' ');
}

/** `an` before a vowel letter — which also covers initialisms read letter-by-letter, e.g. an OHLC chart. */
function indefiniteArticle(prose: string): string {
    return /^[aeiou]/i.test(prose) ? 'an' : 'a';
}

function sentenceCase(prose: string): string {
    return prose.charAt(0).toUpperCase() + prose.slice(1);
}

/**
 * Meta-description candidates for one example, from longest to shortest.
 *
 * The variant name has to stay — it is what distinguishes this page's description from its five
 * siblings' — so the boilerplate around it is what gives way on the long names: a chart called
 * `Radar Line, Radar Area And Nightingale Combination Chart` has no room for `An interactive ...
 * built with AG Charts` as well as a tail.
 */
function metaCandidates(prose: string, configures: string): string[] {
    const leadIns = [
        `An interactive ${prose} built with AG Charts`,
        `${sentenceCase(prose)} built with AG Charts`,
        sentenceCase(prose),
    ];
    return leadIns
        .flatMap((leadIn) => META_TAILS.map((tail) => `${leadIn}: ${configures}. ${tail}`))
        .filter((candidate) => candidate.includes('AG Charts'));
}

function familyCopy(page: GallerySeoPage): GalleryFamilyCopy {
    const copy = GALLERY_FAMILY_COPY[page.chartSeriesName];
    if (!copy) {
        throw new Error(
            `No gallery copy for chart family "${page.chartSeriesName}" (example "${page.name}"). ` +
                `Add a row to GALLERY_FAMILY_COPY in components/gallery/galleryCopy.ts.`
        );
    }
    return copy;
}

/** Pick the candidate inside [min, max], else the one whose length is closest to the band. */
function bestFit(candidates: string[], min: number, max: number): string {
    const distance = (value: string) => Math.max(min - value.length, value.length - max, 0);
    return candidates.reduce((best, candidate) => (distance(candidate) < distance(best) ? candidate : best));
}

/**
 * Resolve the title, H1, meta description and intro for a gallery example page.
 *
 * Hand-written copy in `GALLERY_PAGE_COPY` wins field by field, so a page can override just its
 * title and still take a derived intro. Everything else composes from the example's own title and
 * its chart family's row in `GALLERY_FAMILY_COPY`.
 */
export function resolveGallerySeo(page: GallerySeoPage): GallerySeo {
    const overrides = GALLERY_PAGE_COPY[page.name] ?? {};
    const { hook, visualises, configures, adjusts } = familyCopy(page);

    const displayTitle = withoutSimplePrefix(page.title);
    const h1 = resolveGalleryH1(page);
    const prose = toProse(displayTitle);
    const article = indefiniteArticle(prose);

    // The hook is dropped rather than truncated: a clipped keyword phrase helps nobody.
    const title =
        overrides.seoTitle ?? bestFit([`${h1} - ${hook} | AG Charts`, `${h1} | AG Charts`], 0, MAX_TITLE_LENGTH);

    const description =
        overrides.seoDescription ?? bestFit(metaCandidates(prose, configures), META_TARGET_MIN, META_TARGET_MAX);

    const intro =
        overrides.intro ??
        `This example shows ${article} ${prose} built with AG Charts, ${visualises}. ` +
            `Configure ${adjusts}, then build the same chart in ${GALLERY_INTRO_FRAMEWORKS}.`;

    return { title, h1, description, intro };
}
