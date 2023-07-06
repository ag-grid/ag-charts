import type { CollectionEntry } from 'astro:content';
import fsOriginal from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { FRAMEWORKS, INTERNAL_FRAMEWORKS, TYPESCRIPT_INTERNAL_FRAMEWORKS, localPrefix } from '../constants';
import { getSourceExamplesPathUrl } from '../features/examples-generator/utils/fileUtils';
import type { InternalFramework, Library } from '../types/ag-grid';
import { getGeneratedContentsFileList } from '../features/examples-generator/examplesGenerator';

export type DocsPage =
    | CollectionEntry<'docs'>
    | {
          slug: string;
      };

export interface InternalFrameworkExample {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}

export interface DevFileRoute {
    params: {
        filePath: string;
    };
    props: {
        fullFilePath: string;
    };
}

/**
 * Mapping for dev files, from route to file path
 *
 * NOTE: File path is after `getDistUrl()`
 */
export const DEV_FILE_PATH_MAP: Record<string, string> = {
    'ag-charts-community/dist/ag-charts-community.cjs.js': 'packages/ag-charts-community/main.cjs',
};

/**
 * The dist url where packages are generated
 */
const getDistUrl = (): URL => {
    return new URL('../../../../dist', import.meta.url);
};

// TODO: Figure out published packages
export const isUsingPublishedPackages = () => false;
export const isPreProductionBuild = () => false;
export const isBuildServerBuild = () => false;

export const isTypescriptInternalFramework = (internalFramework: InternalFramework) => {
    return TYPESCRIPT_INTERNAL_FRAMEWORKS.includes(internalFramework);
};

export const getCacheBustingUrl = (url: string, timestamp: number) => `${url}?t=${timestamp}`;

function ignoreUnderscoreFiles(page: DocsPage) {
    const pageFolders = page.slug.split('/');
    const pageName = pageFolders[pageFolders.length - 1];
    return pageName && !pageName.startsWith('_');
}

export function getDocPagesList(pages: DocsPage[]) {
    return pages.filter(ignoreUnderscoreFiles);
}

export function getDocPages(pages: DocsPage[]) {
    const frameworkPages = FRAMEWORKS.map((framework) => {
        return getDocPagesList(pages).map((page: { slug: string }) => {
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

/**
 * Dynamic path where examples are
 */
export const getExampleUrl = ({
    internalFramework,
    pageName,
    exampleName,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}) => {
    return path.join('/', internalFramework, pageName, 'examples', exampleName);
};

/**
 * Dynamic path where example files are
 */
export const getExampleFileUrl = ({
    internalFramework,
    pageName,
    exampleName,
    fileName,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
    fileName: string;
}) => {
    return path.join('/', internalFramework, pageName, 'examples', exampleName, fileName);
};

export const getDevFileUrl = ({ filePath }: { filePath: string }) => {
    return path.join(localPrefix, filePath);
};

export const getDevFileList = () => {
    const distFolder = getDistUrl();
    return Object.values(DEV_FILE_PATH_MAP).map((file) => {
        return path.join(distFolder.pathname, file);
    });
};

export const getBoilerPlateUrl = ({
    library,
    internalFramework,
}: {
    library: Library;
    internalFramework: InternalFramework;
}) => {
    let boilerPlateFramework;
    switch (internalFramework) {
        case 'reactFunctional':
            boilerPlateFramework = 'react';
            break;
        case 'reactFunctionalTs':
            boilerPlateFramework = 'react-ts';
            break;
        default:
            boilerPlateFramework = internalFramework;
            break;
    }

    const boilerplatePath = path.join('/example-runner', `${library}-${boilerPlateFramework}-boilerplate`);

    return boilerplatePath;
};

export const getInternalFrameworkExamples = async ({
    pages,
}: {
    pages: DocsPage[];
}): Promise<InternalFrameworkExample[]> => {
    const internalFrameworkPageNames = INTERNAL_FRAMEWORKS.map((internalFramework) => {
        return pages.map((page: { slug: string }) => {
            return { internalFramework, pageName: page.slug };
        });
    }).flat();

    const examplePromises = internalFrameworkPageNames.map(async ({ internalFramework, pageName }) => {
        const sourceExamplesPathUrl = getSourceExamplesPathUrl({
            pageName,
        });

        const examples = fsOriginal.existsSync(sourceExamplesPathUrl) ? await fs.readdir(sourceExamplesPathUrl) : [];

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

/**
 * Get dev files for local development
 */
export function getDevFiles(): DevFileRoute[] {
    const files = Object.keys(DEV_FILE_PATH_MAP).map((filePath) => {
        const sourceFilePath = DEV_FILE_PATH_MAP[filePath];
        const fullFilePath = path.join(getDistUrl().pathname, sourceFilePath);

        return {
            filePath,
            fullFilePath,
        };
    });

    return files.map(({ filePath, fullFilePath }) => {
        return {
            params: {
                filePath,
            },
            props: {
                fullFilePath,
            },
        };
    });
}

export async function getDocExamplePages({ pages }: { pages: DocsPage[] }) {
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
        const exampleFileList = await getGeneratedContentsFileList({
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
