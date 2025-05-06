import { getIsDev } from '@utils/env';
import { defineMiddleware } from 'astro/middleware';
import { parse } from 'node-html-parser';
import { basename, extname } from 'path';
import type { BuiltInParserName } from 'prettier';
import * as prettier from 'prettier';

const env = import.meta.env;

const rewriteAstroGeneratedContent = (body: string) => {
    const html = parse(body, { comment: true });

    // In dev, add public site url base for all scripts, so it works in external sites
    if (env.DEV) {
        html.querySelectorAll('script').forEach((script: HTMLElement) => {
            const src = script.getAttribute('src');
            const shouldAddScript = src == null ? false : src.startsWith('/');
            if (shouldAddScript) {
                script.setAttribute('src', new URL(src!, env.PUBLIC_SITE_URL).toString());
            }
        });
    }
    return html.toString();
};

const BINARY_EXTENSIONS = ['png', 'webp', 'jpeg', 'jpg'];

async function formatContents(body: any) {
    const { files } = body;

    for (const file in files) {
        let parser: BuiltInParserName | undefined;
        switch (extname(file)) {
            case '.js':
            case '.jsx':
                parser = 'babel';
                break;
            case '.ts':
            case '.tsx':
                parser = 'typescript';
                break;
        }

        if (parser != null) {
            try {
                files[file] = await prettier.format(files[file], { parser });
            } catch {
                // Ignored
            }
        }
    }
}

function isHtml(path: string) {
    const pathItems = path.split('/');
    const fileName = pathItems.slice(-1)[0];
    const isExtension = fileName.includes('.');

    return !isExtension;
}

function isBinary(path: string) {
    const pathItems = path.split('/');
    const fileName = pathItems.slice(-1)[0];
    const fileNameParts = fileName.split('.');
    const extension = fileNameParts.slice(-1)[0];

    return BINARY_EXTENSIONS.includes(extension);
}

export const onRequest = defineMiddleware(async (context, next) => {
    const response = await next();

    if (getIsDev() && basename(context.url.pathname) === 'contents.json') {
        const body = await response.json();
        await formatContents(body);

        return new Response(JSON.stringify(body), {
            status: 200,
            headers: response.headers,
        });
    }

    const isExample = context.url.pathname.includes('/examples/');
    if (!isExample || isBinary(context.url.pathname)) {
        return response;
    }

    let body = await response.text();

    if (isHtml(context.url.pathname)) {
        body = rewriteAstroGeneratedContent(body);

        try {
            body = await prettier.format(body, {
                parser: 'html',
            });
        } catch {
            // eslint-disable-next-line no-console
            console.warn(`Unable to prettier format for [${context.url.pathname}]`);
        }
    }

    return new Response(body, {
        status: 200,
        headers: response.headers,
    });
});
