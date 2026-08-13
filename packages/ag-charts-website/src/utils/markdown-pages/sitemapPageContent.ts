/**
 * Metadata for the HTML sitemap page, shared between `sitemap.astro` and its markdown twin
 * (`/sitemap.md`) so the title, description and heading cannot drift between the two renderings.
 */
export const SITEMAP_PAGE_CONTENT = {
    title: 'Sitemap | AG Charts',
    description: 'The AG Charts sitemap. Contains links to every page on the site, including docs.',
    heading: 'Sitemap',
} as const;
