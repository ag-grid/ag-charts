import { getIsStaging } from '@utils/env';

import { CHARTS_SITE_URL } from '../constants';

const disallowAllRobotsTxt = () => 'User-agent: *\nDisallow: /';

const productionRobotsTxt = () => `User-agent: *\nAllow: /\n\nSitemap: ${CHARTS_SITE_URL}/sitemap-0.xml`;

export function GET() {
    const output = getIsStaging() ? disallowAllRobotsTxt() : productionRobotsTxt();

    return new Response(output, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}
