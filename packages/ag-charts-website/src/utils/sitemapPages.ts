import { getDocsExamplePages, getDocsPages } from '@features/docs/utils/pageData';
import * as docsUrlPaths from '@features/docs/utils/urlPaths';
import { getExamplePageUrl } from '@features/docs/utils/urlPaths';
import { getGalleryExamplePages } from '@features/gallery/utils/pageData';
import * as galleryUrlPaths from '@features/gallery/utils/urlPaths';
import { getCollection, getEntry } from 'astro:content';

import { getDebugPageUrls } from './pages';
import { isTestPage } from './sitemap';
import { urlWithBaseUrl } from './urlWithBaseUrl';

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

const getGalleryExamplePaths = async () => {
    const galleryDataEntry = await getEntry('gallery', 'data');
    const pages = getGalleryExamplePages({ galleryData: galleryDataEntry.data });
    const galleryExamples = pages.map(({ params }) => {
        const { exampleName } = params;
        return {
            exampleName,
        };
    });
    const galleryExamplePaths = galleryExamples.flatMap(({ exampleName }) => {
        return [
            galleryUrlPaths.getExampleUrl({ exampleName }),
            galleryUrlPaths.getExampleRunnerExampleUrl({ exampleName }),
            galleryUrlPaths.getPlainExampleUrl({ exampleName }),
            galleryUrlPaths.getExampleCodeSandboxUrl({ exampleName }),
            galleryUrlPaths.getExamplePlunkrUrl({ exampleName }),
        ];
    });

    return galleryExamplePaths;
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
    return [urlWithBaseUrl('/404')];
};

export async function getSitemapIgnorePaths() {
    const paths = await Promise.all([
        getDocsExamplePaths(),
        getGalleryExamplePaths(),
        getTestPages(),
        getDebugPageUrls(),
        getIgnoredPages(),
        getHiddenPages(),
    ]);

    return paths.flat();
}
