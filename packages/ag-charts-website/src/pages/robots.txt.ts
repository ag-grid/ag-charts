import { SITE_URL } from '@constants';
import { getIsProduction, getIsStaging } from '@utils/env';
import { pathJoin } from '@utils/pathJoin';
import { getSitemapIgnorePaths } from '@utils/sitemapPages';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

const disallowAllRobotsTxt = () => 'User-agent: * Disallow: /';

const productionRobotsTxt = (allowPaths: string[] = [], disallowPaths: string[] = []) => `User-agent: *
Allow: ${urlWithBaseUrl('/')}
${allowPaths
    .map((path) => {
        return `Allow: ${path}`;
    })
    .join('\n')}
${disallowPaths
    .map((path) => {
        return `Disallow: ${path}`;
    })
    .join('\n')}

Sitemap: ${pathJoin(SITE_URL, urlWithBaseUrl('/sitemap-0.xml'))}
`;

export async function GET() {
    // Only generate robots.txt in staging environments
    if (!getIsStaging() && !getIsProduction()) {
        return new Response('Not Found', { status: 404 });
    }

    let output;
    if (!getIsProduction()) {
        output = disallowAllRobotsTxt();
    } else {
        const ignorePaths = await getSitemapIgnorePaths();
        output = productionRobotsTxt([], ignorePaths);
    }

    return new Response(output, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}
