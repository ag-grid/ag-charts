import { getDocsPages } from '@components/docs/utils/pageData';
import { getExamplePageUrl } from '@components/docs/utils/urlPaths';
import { FRAMEWORK_REDIRECT_PATH } from '@constants';
import { getCollection } from 'astro:content';

import { getDebugPageUrls } from './pages';
import { urlWithBaseUrl } from './urlWithBaseUrl';

function addTrailingSlash(path: string) {
    return path.slice(-1) === '/' ? path : `${path}/`;
}

const getDocsExamplePaths = () => {
    return [urlWithBaseUrl('/*/*/examples/')];
};

const getInternalPages = () => {
    return [
        urlWithBaseUrl('/*/*-test/'),
        urlWithBaseUrl('/*/*-e2e/'),
        urlWithBaseUrl('/gallery-test'),
        urlWithBaseUrl('/*/benchmarks/'),
        // Demo app examples: the routes and their built SPA assets are published but
        // must stay out of search engines and AI crawlers.
        urlWithBaseUrl('/demos/'),
        urlWithBaseUrl('/internal-demos/'),
    ];
};

const getHiddenPages = async () => {
    const pages = await getCollection('docs');
    const docsHiddenPages = getDocsPages(pages)
        .filter(({ props }) => props.page.data.hidden)
        .map((p) => {
            const { framework, pageName } = p.params;
            return getExamplePageUrl({ framework, path: pageName });
        });

    return docsHiddenPages;
};

const getIgnoredPages = () => {
    return [
        urlWithBaseUrl('/404'),
        addTrailingSlash(urlWithBaseUrl('/gallery/examples')),
        addTrailingSlash(urlWithBaseUrl('/archive')),
        // Redirects
        addTrailingSlash(urlWithBaseUrl(`/${FRAMEWORK_REDIRECT_PATH}`)),
        // Release note stubs — minimal content, crawl waste
        addTrailingSlash(urlWithBaseUrl('/changelog/releases')),
        // Contact form result pages — post-submission confirmations, nothing to index
        addTrailingSlash(urlWithBaseUrl('/contact/failure')),
        addTrailingSlash(urlWithBaseUrl('/contact/success')),
    ];
};

export async function getSitemapIgnorePaths() {
    const asyncPages = (await Promise.all([getHiddenPages(), getDebugPageUrls()])).flat();
    const paths = [getDocsExamplePaths(), getInternalPages(), getIgnoredPages(), asyncPages];

    return paths.flat();
}
