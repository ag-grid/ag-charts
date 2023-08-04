import { FRAMEWORKS } from '@constants';
import { getPagesList, getInternalFrameworkExamples } from './filesData';
import type { DocsPage } from '@utils/pages';
import { getGeneratedDocsContentsFileList } from './examplesGenerator';

export function getDocsPages(pages: DocsPage[]) {
    const frameworkPages = FRAMEWORKS.map((framework) => {
        return getPagesList(pages).map((page) => {
            return {
                framework,
                pageName: page.slug,
                page,
            };
        });
    }).flat();

    return frameworkPages.map(({ framework, pageName, page }) => {
        return {
            params: {
                framework,
                pageName,
            },
            props: {
                page,
            },
        };
    });
}

export async function getDocsExamplePages({ pages }: { pages: DocsPage[] }) {
    const examples = await getInternalFrameworkExamples({ pages });

    return examples.map(({ internalFramework, pageName, exampleName }) => {
        return {
            params: {
                internalFramework,
                pageName,
                exampleName,
            },
        };
    });
}

export async function getDocExampleFiles({ pages }: { pages: DocsPage[] }) {
    const examples = await getInternalFrameworkExamples({ pages });
    const exampleFilesPromises = examples.map(async ({ internalFramework, pageName, exampleName }) => {
        const exampleFileList = await getGeneratedDocsContentsFileList({
            internalFramework,
            pageName,
            exampleName,
        });

        return exampleFileList.map((fileName) => {
            return {
                internalFramework,
                pageName,
                exampleName,
                fileName,
            };
        });
    });
    const exampleFiles = (await Promise.all(exampleFilesPromises)).flat();

    return exampleFiles.map(({ internalFramework, pageName, exampleName, fileName }) => {
        return {
            params: {
                internalFramework,
                pageName,
                exampleName,
                fileName,
            },
        };
    });
}
