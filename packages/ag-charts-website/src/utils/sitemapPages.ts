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

const getTestPages = () => {
    return [urlWithBaseUrl('/*/*-test/'), urlWithBaseUrl('/gallery-test'), urlWithBaseUrl('/*/benchmarks/')];
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

// eslint-disable-next-line @typescript-eslint/require-await
const getIgnoredPages = () => {
    return [
        urlWithBaseUrl('/404'),
        addTrailingSlash(urlWithBaseUrl('/gallery/examples')),
        addTrailingSlash(urlWithBaseUrl('/archive')),
        // Redirects
        addTrailingSlash(urlWithBaseUrl(`/${FRAMEWORK_REDIRECT_PATH}`)),
    ];
};

export async function getSitemapIgnorePaths() {
    const paths = await Promise.all([
        getDocsExamplePaths(),
        getTestPages(),
        getDebugPageUrls(),
        getIgnoredPages(),
        getHiddenPages(),
    ]);

    return paths.flat();
}
