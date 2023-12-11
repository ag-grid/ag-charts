import { defineMiddleware } from 'astro/middleware';
import { parse } from 'node-html-parser';

import { format } from '../utils/format';

const env = import.meta.env;

const rewriteAstroGeneratedContent = (body: string) => {
    const html = parse(body);
    html.querySelectorAll('script').forEach((script) => {
        const src = script.getAttribute('src');
        if (env.DEV && src != null && src.startsWith('/')) {
            script.setAttribute('src', new URL(src, env.PUBLIC_SITE_URL).toString());
        } else if (env.PROD && (src == null || src === '')) {
            script.remove();
        }
    });
    html.querySelectorAll('link').forEach((link) => {
        const href = link.getAttribute('src');
        if (env.PROD && href != null && href.startsWith('/_astro')) {
            link.remove();
        }
    });
    return html.toString();
};

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
        body = rewriteAstroGeneratedContent(body);
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
