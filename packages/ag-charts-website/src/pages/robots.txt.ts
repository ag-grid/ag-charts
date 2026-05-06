import { getIsArchive, getIsProduction, getIsStaging } from '@utils/env';

const disallowAllRobotsTxt = () => 'User-agent: *\nDisallow: /';

export async function GET() {
    // Only generate robots.txt in staging environments
    if (!getIsStaging()) {
        return new Response('Not Found', { status: 404 });
    }

    const output = disallowAllRobotsTxt();

    return new Response(output, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}
