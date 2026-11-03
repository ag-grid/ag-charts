export interface GalleryCta {
    id: string;
    title: string;
    /** Raw path; the page and its markdown twin each base-prefix it. */
    url: string;
    /** The url is for the default framework, and should follow the visitor's framework instead. */
    followsFramework?: boolean;
}

// Shared with the /gallery.md twin. The trial page is framework-prefixed and the gallery is not,
// so it links to the default framework's page, which `FrameworkLinks` moves to the framework the
// visitor last used once the page is hydrated.
export const GALLERY_CTAS: GalleryCta[] = [
    {
        id: 'gallery-page-free-trial-cta',
        title: 'Free Trial',
        url: '/react/community-vs-enterprise/#request-a-30-day-enterprise-bundle-trial-licence',
        followsFramework: true,
    },
    {
        id: 'gallery-page-buy-now-cta',
        title: 'Buy Now',
        url: '/license-pricing/',
    },
];
