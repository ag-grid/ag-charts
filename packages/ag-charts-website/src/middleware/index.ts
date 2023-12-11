import { Response as MiniFlareResponse } from '@miniflare/core';
import { HTMLRewriter } from '@miniflare/html-rewriter';
import { defineMiddleware } from 'astro/middleware';

import { format } from '../utils/format';

const env = import.meta.env;

const astroGeneratedContextRewriter = new HTMLRewriter()
    .on('script', {
        element(script) {
            const src = script.getAttribute('src');
            if (env.DEV && src != null && src.startsWith('/')) {
                script.setAttribute('src', new URL(src, env.PUBLIC_SITE_URL).toString());
            } else if (env.PROD && (src == null || src === '')) {
                script.remove();
            }
        },
    })
    .on('link', {
        element(link) {
            const href = link.getAttribute('src');
            if (env.PROD && href != null && href.startsWith('/_astro')) {
                link.remove();
            }
        },
    });

// We only need to format `.html` files in middleware. The example `index.html` files are fetched in
// the example runner components since the generated content only includes the example fragment
// and not the wrapping framework.
const extensionsToFormat = ['html'];

export const onRequest = defineMiddleware(async (context, next) => {
    const response = await next();

    if (response.text === undefined) {
        return wrapResponse(response);
    }

    const isExample = context.url.pathname.includes('/examples/');

    if (!isExample) {
        return wrapResponse(response);
    }

    let body = await response.text();

    if (context.url.pathname.endsWith('/relative-path')) {
        body = await astroGeneratedContextRewriter.transform(new MiniFlareResponse(body)).text();
    }

    try {
        body = await format(context.url.pathname, body, extensionsToFormat);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`Unable to prettier format for [${context.url.pathname}]`);
    }

    return new Response(body, {
        status: 200,
        headers: response.headers,
    });
});

function wrapResponse(response: Response) {
    // If the response is returned directly, Astro complains with a `MiddlewareNotAResponse` error.
    return new Response(response.body, { status: response.status, headers: response.headers });
}
