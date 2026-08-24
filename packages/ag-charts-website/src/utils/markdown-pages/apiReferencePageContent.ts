import type { PageTitle } from '@components/api-documentation/apiReferenceHelpers';

/**
 * Titles and meta descriptions for the Options and Themes API reference pages, read by both the
 * `.astro` pages and their markdown twins so the two cannot describe the same page differently.
 */
export const OPTIONS_API_PAGE_CONTENT = {
    title: 'Options API',
    description:
        'Options API reference for AG Charts JavaScript Charting Library. Search for any property or browse our tree-data explorer; access types, defaults, and child properties.',
};

export const THEMES_API_PAGE_CONTENT = {
    title: 'Themes API',
    description:
        'Themes API reference for AG Charts JavaScript Charting Library. Search for properties or browse our tree-data explorer; access types, defaults, and child properties.',
};

function capitaliseFirstLetter(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Metadata for one union variant of the options reference, e.g. `series[type='bar']`. */
export function optionsVariantPageContent({ name, type }: PageTitle) {
    const variant = `${capitaliseFirstLetter(type ?? '')} ${capitaliseFirstLetter(name)}`;
    return {
        title: `${OPTIONS_API_PAGE_CONTENT.title} (${variant})`,
        description: `${variant} API reference for AG Charts JavaScript Charting Library. Search for any property or browse our tree-data explorer; access types, defaults, and child properties.`,
    };
}

/**
 * The page heading for a reference page, mirroring the `<h1>` the page renders: a union variant
 * reads as an indexed access (`series[type='bar']`), and the axes record is keyed
 * (`axes.key[type='number']`).
 */
export function apiReferencePageHeading({ name, type }: PageTitle) {
    if (!type) {
        return name;
    }
    return `${name}${name === 'axes' ? '.key' : ''}[type='${type}']`;
}
