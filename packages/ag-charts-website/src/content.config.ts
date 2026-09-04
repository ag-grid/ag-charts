import { FRAMEWORKS, INTERNAL_FRAMEWORKS } from '@constants';
// NOTE: Use glob, instead of file for single object files unless the file is an
// array of objects
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';

const framework = z.enum(FRAMEWORKS as any);
const internalFramework = z.enum(INTERNAL_FRAMEWORKS as any);

const docs = defineCollection({
    loader: glob({ pattern: '**/[^_]*.mdoc', base: './src/content/docs' }),
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        enterprise: z.boolean().optional(),
        hidden: z.boolean().optional(),
        /**
         * Hide right hand side menu
         */
        hideSideMenu: z.boolean().optional(),
        /**
         * Hide left hand page menu
         */
        hidePageMenu: z.boolean().optional(),
        /**
         * Make examples on page very large
         */
        largeExamples: z.boolean().optional(),
        /**
         * Override side navigation headings
         */
        headings: z
            .array(
                z.object({
                    depth: z.number(),
                    slug: z.string(),
                    text: z.string(),
                })
            )
            .optional(),
        migrationVersion: z.string().optional(),

        /**
         * Override the `related:` links in the page's markdown twin, which are otherwise the
         * page's nav neighbours (see `docsRelatedLinks.ts`). Each entry is either a docs page
         * name, titled from the nav, or an explicit `{ title, url }` for anything else.
         */
        related: z.array(z.union([z.string(), z.object({ title: z.string(), url: z.string() })])).optional(),
    }),
});

const apiMenu = defineCollection({
    loader: glob({ base: './src/content/api-menu', pattern: 'menu.json' }),
    schema: z.object({
        items: z.array(
            z.object({
                title: z.string(),
                path: z.string(),
            })
        ),
    }),
});

const announcementBanner = defineCollection({
    loader: glob({ base: './src/content/announcement-banner', pattern: 'announcement-banner.json' }),
    schema: z.object({
        enabled: z.boolean(),
        href: z.string(),
        title: z.string(),
        description: z.string().optional(),
        ctaLabel: z.string().optional(),
        external: z.boolean().optional(),
        /** Show the banner from this date onwards (format: YYYY-MM-DD). */
        showDate: z.string().nullable().optional(),
        /** Hide the banner once this date has passed (format: YYYY-MM-DD). */
        untilDate: z.string().nullable().optional(),
    }),
});

const footer = defineCollection({
    loader: glob({ base: './src/content/footer', pattern: 'footer.json' }),
    schema: z.array(
        z.object({
            title: z.string(),
            links: z.array(
                z.object({
                    name: z.string(),
                    url: z.string(),
                    newTab: z.boolean().optional(),
                    iconName: z.string().optional(),
                })
            ),
        })
    ),
});

const faqs = defineCollection({
    loader: glob({ base: './src/content/faqs', pattern: '*.json' }),
    schema: z.array(
        z.object({
            question: z.string(),
            answer: z.string(),
        })
    ),
});

const siteHeader = defineCollection({
    loader: glob({ base: './src/content/site-header', pattern: 'header.json' }),
    schema: z.object({
        header: z.object({
            items: z.array(
                z.object({
                    title: z.string(),
                    url: z.string().optional(),
                    path: z.string().optional(),
                    icon: z.string().optional(),
                    isCollapsed: z.boolean().optional(),
                })
            ),
        }),
    }),
});

const versions = defineCollection({
    loader: glob({ base: './src/content/versions', pattern: 'ag-charts-versions.json' }),
    schema: z.array(
        z.object({
            version: z.string(),
            date: z.string().optional(),
            landingPageHighlight: z.string().optional(),
            highlights: z
                .array(
                    z.object({
                        text: z.string(),
                        path: z.string().optional(),
                    })
                )
                .optional(),
            notesPath: z.string().optional(),
            hideBlogPostLink: z.boolean().optional(),
            versionType: z.enum(['Major', 'Minor', 'Patch']).optional(),
            noDocs: z.boolean().optional(),
            noArchive: z.boolean().optional(),
        })
    ),
});

const navType = z.enum(['item', 'group']);
const navBase = {
    title: z.string().optional(),
    type: navType.optional(),
    path: z.string().optional(),
    url: z.string().optional(),
    icon: z.string().optional(),
    frameworks: z.array(framework).optional(),
    childPaths: z.array(z.string()).optional(),
    isEnterprise: z.boolean().optional(),
    isPricingFeature: z.boolean().optional(),

    hideTitle: z.boolean().optional(),
};
const navLevel5 = z.object({
    ...navBase,
});
const navLevel4 = z.object({
    ...navBase,
    children: z.array(navLevel5).optional(),
});
const navLevel3 = z.object({
    ...navBase,
    children: z.array(navLevel4).optional(),
});
const navLevel2 = z.object({
    ...navBase,
    children: z.array(navLevel3).optional(),
});
const navLevel1 = z.object({
    ...navBase,
    children: z.array(navLevel2).optional(),
});
const docsNav = defineCollection({
    loader: glob({ base: './src/content/docs-nav', pattern: 'nav.json' }),
    schema: z.object({
        sections: z.array(navLevel1),
    }),
});

const metadata = defineCollection({
    loader: glob({ base: './src/content/metadata', pattern: 'metadata.json' }),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        canonicalUrlBase: z.string(),
        socialImage: z.string().optional(),
    }),
});

const gallery = defineCollection({
    loader: glob({ base: './src/content/gallery', pattern: 'data.json' }),
    schema: z.object({
        homepage: z.array(
            z.object({
                seriesExampleName: z.string(),
            })
        ),
        series: z.array(
            z.array(
                z.object({
                    title: z.string(),
                    seriesName: z.string(),
                    seriesLink: z.string().optional(),
                    icon: z.string(),
                    enterprise: z.boolean().optional(),
                    examples: z.array(
                        z.object({
                            title: z.string(),
                            name: z.string(),
                            hidden: z.boolean().optional(),
                        })
                    ),
                })
            )
        ),
    }),
});

const homepageGallery = defineCollection({
    loader: glob({ base: './src/content/homepage-gallery', pattern: 'examples.json' }),
    schema: z.record(z.string(), z.string()),
});

const moduleMappingsChild: z.ZodTypeAny = z.lazy(() =>
    z.object({
        name: z.string(),
        moduleName: z.string().optional(),
        path: z.string().optional(),
        isEnterprise: z.boolean().optional(),
        hide: z.boolean().optional(),
        ssrmBundled: z.boolean().optional(),
        children: z.array(moduleMappingsChild).optional(),
    })
);

const moduleMappings = defineCollection({
    loader: glob({ base: './src/content/module-mappings', pattern: '*.json' }),
    schema: z.object({
        groups: z.array(
            z.object({
                name: z.string(),
                hideFromSelection: z.boolean().optional(),
                children: z.array(moduleMappingsChild),
            })
        ),
    }),
});

const landingPages = defineCollection({
    loader: glob({ base: './src/content/landing-pages', pattern: '*.json' }),
    schema: z.object({
        meta: z.object({
            title: z.string(),
            description: z.string(),
        }),
        productName: z.string().optional(),
        internalFramework,
        packageName: z.string().optional(),
        docsPath: z.string(),
        analyticsPrefix: z.string(),
        sections: z.array(z.any()), // Flexible for various section types
    }),
});

// `url` is a raw path, base-prefixed at render.
const homepageSectionCta = z.object({
    title: z.string(),
    url: z.string(),
    id: z.string(),
});

// Homepage marketing copy (index.astro). The bespoke interactive islands stay inline in the
// page; only the hero and section text lives here so it can be shared with the /index.md twin.
const homepage = defineCollection({
    loader: glob({ base: './src/content/homepage', pattern: 'homepage.json' }),
    schema: z.object({
        hero: z.object({
            heading: z.string(),
            subHeading: z.string(),
            cta: z.object({
                title: z.string(),
                // Raw path (not base-prefixed); index.astro wraps it with urlWithBaseUrl.
                url: z.string(),
            }),
        }),
        sections: z.object({
            gallery: z.object({
                tag: z.string(),
                heading: z.string(),
                // Rendered as one row by index.astro; LandingPageSection only takes a single CTA.
                ctas: z.array(homepageSectionCta),
            }),
            financial: z.object({
                tag: z.string(),
                heading: z.string(),
                subHeading: z.string(),
                ctaTitle: z.string(),
                ctaUrl: z.string(),
                ctaId: z.string(),
            }),
            maps: z.object({
                tag: z.string(),
                heading: z.string(),
                subHeading: z.string(),
                ctaTitle: z.string(),
                ctaUrl: z.string(),
                ctaId: z.string(),
                cards: z.array(
                    z.object({
                        heading: z.string(),
                        description: z.string(),
                    })
                ),
            }),
            integrated: z.object({
                tag: z.string(),
                heading: z.string(),
                subHeadingHtml: z.string(),
            }),
            releases: z.object({
                tag: z.string(),
                heading: z.string(),
                subHeading: z.string(),
                ctaTitle: z.string(),
                ctaUrl: z.string(),
                ctaId: z.string(),
            }),
            faqs: z.object({
                tag: z.string(),
                heading: z.string(),
                subHeading: z.string(),
            }),
        }),
    }),
});

const contactResults = defineCollection({
    loader: glob({ base: '../../external/ag-website-shared/src/content/contact', pattern: 'result.json' }),
    schema: z.record(
        z.string(),
        z.object({
            title: z.string(),
            description: z.string(),
            heroTag: z.string(),
            heroHeading: z.string(),
        })
    ),
});

export const collections = {
    docs,
    homepage,
    apiMenu,
    footer,
    announcementBanner,
    faqs,
    siteHeader,
    versions,
    docsNav,
    metadata,
    gallery,
    homepageGallery,
    moduleMappings,
    landingPages,
    contactResults,
};
