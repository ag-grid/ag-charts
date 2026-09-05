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
        // SE-182: NOT /*/*-test/ or /demos/ — both carry their own page-level signal
        // (self-canonical, noindex) that a Disallow would stop Google from ever reading,
        // since it can't crawl the page to see it. Let the page signal do the work instead,
        // same principle as the blog migration (SE-188).
        urlWithBaseUrl('/*/*-e2e/'),
        urlWithBaseUrl('/gallery-test'),
        urlWithBaseUrl('/*/benchmarks/'),
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
        // SE-182: NOT /archive — it 301s to /charts/documentation-archive/, and a Disallow
        // would hide that redirect from Google instead of letting it transfer. Same
        // principle as the blog migration (SE-188).
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
