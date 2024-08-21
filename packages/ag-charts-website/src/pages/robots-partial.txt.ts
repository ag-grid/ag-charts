import { getSitemapIgnorePaths } from '@utils/sitemapPages';
import type { APIContext } from 'astro';

const productionRobotsTxt = (disallowPaths: string[] = []) =>
    disallowPaths
        .map((path) => {
            return `Disallow: ${path}`;
        })
        .join('\n');

/**
 * Generate robots disallow list, for root URL to consume
 */
export async function GET(_context: APIContext) {
    const ignorePaths = await getSitemapIgnorePaths();
    const output = productionRobotsTxt(ignorePaths);

    return new Response(output, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}
