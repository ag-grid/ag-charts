import { SITE_URL } from '@constants';
import { getIsProduction } from '@utils/env';
import { urlWithBaseUrl } from '@utils/pages';
import { pathJoin } from '@utils/pathJoin';
import { getSitemapIgnorePaths } from '@utils/sitemapPages';
import type { APIContext } from 'astro';

// Disallow the entire site on dev
const devRobotsTxt = () => 'User-agent: * Disallow: /';

const productionRobotsTxt = (disallowPaths: string[] = []) => `User-agent: *
${disallowPaths
    .map((path) => {
        return `Disallow: ${path}`;
    })
    .join('\n')}

Sitemap: ${pathJoin(SITE_URL, urlWithBaseUrl('/sitemap-index.xml'))}
`;

export async function get(context: APIContext) {
    const isProduction = getIsProduction();

    const ignorePaths = await getSitemapIgnorePaths();
    const output = isProduction ? productionRobotsTxt(ignorePaths) : devRobotsTxt();

    return new Response(output, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}
