import {
    type JsonLdObject,
    buildAgGridOrganization,
    buildSoftwareApplication,
    buildWebSite,
    siteRootUrl,
} from '@ag-website-shared/utils/structuredData';

import { urlWithBaseUrl } from './urlWithBaseUrl';

const DEFAULT_SOCIAL_IMAGE = '/images/ag-charts-social.png';

/**
 * The page's social card image as an absolute URL on the canonical origin. Open Graph and Twitter
 * crawlers do not resolve a relative image URL against the page, so a relative one shows no card
 * (SE-48).
 */
export function getSocialImageUrl({
    canonicalUrlBase,
    image = DEFAULT_SOCIAL_IMAGE,
}: {
    canonicalUrlBase: string;
    /** Site-relative (with or without a leading slash) or absolute. */
    image?: string;
}): string {
    return new URL(urlWithBaseUrl(image), canonicalUrlBase).href;
}

/**
 * The site-wide JSON-LD graph every indexable page carries: the AG Grid organisation, this website
 * and the AG Charts product. The product carries a single offer, the free Community edition: an
 * offer without a price is a structured-data error, so no priced-elsewhere Enterprise offer is
 * listed (SE-162).
 */
export function buildSiteStructuredData({
    canonicalUrlBase,
    name,
    description,
    version,
}: {
    canonicalUrlBase: string;
    name: string;
    description: string;
    version: string;
}): JsonLdObject[] {
    return [
        buildAgGridOrganization(),
        buildWebSite({ canonicalUrlBase, name, description }),
        buildSoftwareApplication({
            canonicalUrlBase,
            name: 'AG Charts',
            version: version.split('-')[0],
            offers: [
                {
                    '@type': 'Offer',
                    name: 'AG Charts Community',
                    price: '0',
                    priceCurrency: 'USD',
                    url: `${siteRootUrl(canonicalUrlBase)}license-pricing/`,
                },
            ],
        }),
    ];
}
