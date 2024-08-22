import { getSitemapIgnorePaths } from '@utils/sitemapPages';
import type { APIContext } from 'astro';

/**
 * Generate robots disallow list, for root URL to consume
 */
export async function GET(_context: APIContext) {
    const ignorePaths = await getSitemapIgnorePaths();

    return new Response(JSON.stringify(ignorePaths), {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}
