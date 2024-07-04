import { getDocsExamplePages, getDocsPages } from '@features/docs/utils/pageData';
import * as docsUrlPaths from '@features/docs/utils/urlPaths';
import { getExamplePageUrl } from '@features/docs/utils/urlPaths';
import { getCollection } from 'astro:content';

import { getDebugPageUrls } from './pages';
import { isTestPage } from './sitemap';
import { urlWithBaseUrl } from './urlWithBaseUrl';

/**
 * Legacy archive versions that don't have `noindex` on the generated pages
 */
const LEGACY_ARCHIVE_VERSIONS = ['9.0.1', '9.0.2', '9.1.0', '9.2.0', '9.3.0', '9.3.1', '10.0.0'];

function addTrailingSlash(path: string) {
    return path.slice(-1) === '/' ? path : `${path}/`;
}

const getDocsExamplePaths = async () => {
    const pages = await getCollection('docs');
    const docExamplePathsPromises = await getDocsExamplePages({
        pages,
    });
    const docExamples = docExamplePathsPromises.map(({ params }) => {
        const { internalFramework, pageName, exampleName } = params;
        return {
            internalFramework,
            pageName,
            exampleName,
        };
    });
    const docExamplePaths = docExamples.flatMap(({ internalFramework, pageName, exampleName }) => {
        return [
            docsUrlPaths.getExampleUrl({ internalFramework, pageName, exampleName }),
            docsUrlPaths.getExampleRunnerExampleUrl({ internalFramework, pageName, exampleName }),
            docsUrlPaths.getExampleCodeSandboxUrl({ internalFramework, pageName, exampleName }),
            docsUrlPaths.getExamplePlunkrUrl({ internalFramework, pageName, exampleName }),
        ];
    });

    return docExamplePaths;
};

const getTestPages = async () => {
    const pages = await getCollection('docs');
    const docsTestPages = getDocsPages(pages)
        .map(({ params }) => {
            const { framework, pageName } = params;
            return getExamplePageUrl({ framework, path: pageName });
        })
        .filter(isTestPage);

    return docsTestPages.concat(urlWithBaseUrl('/gallery-test'));
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
    const legacyArchiveVersions = LEGACY_ARCHIVE_VERSIONS.map((version) =>
        addTrailingSlash(urlWithBaseUrl(`/archive/${version}`))
    );
    return [urlWithBaseUrl('/404'), addTrailingSlash(urlWithBaseUrl('/gallery/examples')), ...legacyArchiveVersions];
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
