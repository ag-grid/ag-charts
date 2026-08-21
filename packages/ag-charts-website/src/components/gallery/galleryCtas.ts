export interface GalleryCta {
    id: string;
    title: string;
    /** Raw path; the page and its markdown twin each base-prefix it. */
    url: string;
}

// Shared with the /gallery.md twin. The trial page is framework-prefixed and the gallery is not,
// so it takes the default framework.
export const GALLERY_CTAS: GalleryCta[] = [
    {
        id: 'gallery-page-free-trial-cta',
        title: 'Free Trial',
        url: '/r/community-vs-enterprise/#request-a-30-day-enterprise-bundle-trial-licence',
    },
    {
        id: 'gallery-page-buy-now-cta',
        title: 'Buy Now',
        url: '/license-pricing/',
    },
];
