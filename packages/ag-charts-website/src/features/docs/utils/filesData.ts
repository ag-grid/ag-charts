import fs from 'fs/promises';

// NOTE: These imports can't be aliases because it is used by `astro.config.mjs`
// and ts alias paths don't work there
import { INTERNAL_FRAMEWORKS } from '../../../constants';
import { getFolders } from '../../../utils/fs';
import { type DocsPage, type InternalFrameworkExample, getContentRootFileUrl } from '../../../utils/pages';
import { pathJoin } from '../../../utils/pathJoin';

function ignoreUnderscoreFiles(page: DocsPage) {
    const pageFolders = page.slug.split('/');
    const pageName = pageFolders[pageFolders.length - 1];
    return pageName && !pageName.startsWith('_');
}

export const getExamplesPathUrl = ({ pageName }: { pageName: string }) => {
    const contentRoot = getContentRootFileUrl();
    const sourceExamplesPath = pathJoin(contentRoot.pathname, 'docs', pageName, '_examples');

    return new URL(sourceExamplesPath, import.meta.url);
};

export const getFolderUrl = ({ pageName, exampleName }: { pageName: string; exampleName: string }) => {
    const examplesFolderPath = getExamplesPathUrl({
        pageName,
    }).pathname;
    const exampleFolderPath = pathJoin(examplesFolderPath, exampleName);

    return new URL(exampleFolderPath, import.meta.url);
};

export const getInternalFrameworkExamples = async ({
    pages,
}: {
    pages: DocsPage[];
}): Promise<InternalFrameworkExample[]> => {
    const internalFrameworkPageNames = INTERNAL_FRAMEWORKS.flatMap((internalFramework) => {
        return pages.map((page) => {
            return { internalFramework, pageName: page.slug };
        });
    });

    const examplePromises = internalFrameworkPageNames.map(async ({ internalFramework, pageName }) => {
        const docsExamplesPathUrl = getExamplesPathUrl({
            pageName,
        });

        const examples = await getFolders(docsExamplesPathUrl.pathname);
        return examples.map((exampleName) => {
            return {
                internalFramework,
                pageName,
                exampleName,
            };
        });
    });
    const examples = (await Promise.all(examplePromises)).flat();
    return examples;
};

export const getPagesList = (pages: DocsPage[]) => {
    return pages.filter(ignoreUnderscoreFiles);
};

export const getAllExamplesFileList = async () => {
    const contentRoot = getContentRootFileUrl();
    const pagesFolder = pathJoin(contentRoot.pathname, 'docs');
    const pages = await fs.readdir(pagesFolder);

    const examplesPromises = pages.map(async (pageName) => {
        const examplesFolder = pathJoin(pagesFolder, pageName, '_examples');
        const examples = await getFolders(examplesFolder);

        return examples.map((file) => {
            return pathJoin(examplesFolder, file);
        });
    });
    const exampleFolders = (await Promise.all(examplesPromises)).flat();

    const exampleFilesPromises = exampleFolders.map(async (exampleFolder) => {
        const exampleFiles = await fs.readdir(exampleFolder);
        return exampleFiles.map((exampleFile) => {
            return pathJoin(exampleFolder, exampleFile);
        });
    });
    const exampleFiles = (await Promise.all(exampleFilesPromises)).flat();

    return exampleFiles;
};
