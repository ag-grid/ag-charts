import { FRAMEWORKS } from '@constants';
// NOTE: Use glob, instead of file for single object files unless the file is an
// array of objects
import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const framework = z.enum(FRAMEWORKS as any);

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

export const collections = {
    docs,
    apiMenu,
    footer,
    faqs,
    siteHeader,
    versions,
    docsNav,
    metadata,
    gallery,
    homepageGallery,
    moduleMappings,
};
