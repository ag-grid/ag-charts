import type { CollectionEntry } from 'astro:content';
import {
    FRAMEWORKS,
    INTERNAL_FRAMEWORKS,
    TYPESCRIPT_INTERNAL_FRAMEWORKS,
    SITE_BASE_URL,
    DOCS_FRAMEWORK_PATH_INDEX,
    DEV_FILE_BASE_PATH,
} from '../constants';
import type { InternalFramework, Library } from '../types/ag-grid';
import { getGeneratedDocsContentsFileList } from '../features/examples-generator/examplesGenerator';
import { getIsDev } from './env';
import { getFolders } from './fs';
import fs from 'fs/promises';
import { pathJoin } from './pathJoin';

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
 * NOTE: File path is after `getRootUrl()`
 */
export const DEV_FILE_PATH_MAP: Record<string, string> = {
    'ag-charts-community/dist/ag-charts-community.cjs.js': 'packages/ag-charts-community/dist/main.cjs',
    'ag-charts-enterprise/dist/ag-charts-enterprise.cjs.js': 'packages/ag-charts-enterprise/dist/main.cjs',
    'ag-charts-community/dist/ag-charts-community.umd.js': 'packages/ag-charts-community/dist/main.umd.cjs',
    'ag-charts-enterprise/dist/ag-charts-enterprise.umd.js': 'packages/ag-charts-enterprise/dist/main.umd.cjs',
    'ag-charts-community/dist/main.cjs.map': 'packages/ag-charts-community/dist/main.cjs.map',
    'ag-charts-enterprise/dist/main.cjs.map': 'packages/ag-charts-enterprise/dist/main.cjs.map',
    'ag-charts-community/dist/main.umd.cjs.map': 'packages/ag-charts-community/dist/main.umd.cjs.map',
    'ag-charts-enterprise/dist/main.umd.cjs.map': 'packages/ag-charts-enterprise/dist/main.umd.cjs.map',
    'ag-charts-react/main.js': 'packages/ag-charts-react/dist/index.js',

    'ag-charts-vue/main.js': 'packages/ag-charts-vue/main.js',
    'ag-charts-vue/lib/AgChartsVue.js': 'packages/ag-charts-vue/lib/AgChartsVue.js',
    'ag-charts-vue3/lib/AgChartsVue.js': 'packages/ag-charts-vue3/lib/AgChartsVue.js',
};

export const getChartScriptPath = (sitePrefix?: string) => {
    const sitePrefixUrl = sitePrefix ? sitePrefix : '';
    return pathJoin(sitePrefixUrl, '/dev/ag-charts-community/dist/ag-charts-community.umd.js');
};

export const getChartEnterpriseScriptPath = (sitePrefix?: string) => {
    const sitePrefixUrl = sitePrefix ? sitePrefix : '';
    return pathJoin(sitePrefixUrl, '/dev/ag-charts-enterprise/dist/ag-charts-enterprise.umd.js');
};

export const getContentRootFileUrl = (): URL => {
    const contentRoot = getIsDev()
        ? // Relative to the folder of this file
          '../content'
        : // Relative to `/dist/packages/ag-charts-website/chunks/pages` folder (Nx specific)
          '../../../../../packages/ag-charts-website/src/content';
    return new URL(contentRoot, import.meta.url);
};

/**
 * The root url where the monorepo exists
 */
const getRootUrl = (): URL => {
    const root = getIsDev()
        ? // Relative to the folder of this file
          '../../../../'
        : // Relative to `/dist/packages/ag-charts-website/chunks/pages` folder (Nx specific)
          '../../../../../';
    return new URL(root, import.meta.url);
};

export const urlWithBaseUrl = (url: string = '') => {
    const regex = /^\/(.*)/gm;
    const substitution = `${SITE_BASE_URL}$1`;

    return url.match(regex) ? url.replace(regex, substitution) : url;
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

export function getFrameworkFromPath(path: string) {
    return path.split('/')[DOCS_FRAMEWORK_PATH_INDEX];
}

export function getNewFrameworkPath({
    path,
    currentFramework,
    newFramework,
}: {
    path: string;
    currentFramework: string;
    newFramework: string;
}) {
    return path.replace(`/${currentFramework}`, `/${newFramework}`);
}

export const getDocsExamplesPathUrl = ({ pageName }: { pageName: string }) => {
    const contentRoot = getContentRootFileUrl();
    const examplesFolderPath = pathJoin('docs', pageName, '_examples');
    const sourceExamplesPath = pathJoin(contentRoot.pathname, examplesFolderPath);

    return new URL(sourceExamplesPath, import.meta.url);
};

export const getDocsFolderUrl = ({ pageName, exampleName }: { pageName: string; exampleName: string }) => {
    const examplesFolderPath = getDocsExamplesPathUrl({
        pageName,
    }).pathname;
    const exampleFolderPath = pathJoin(examplesFolderPath, exampleName);

    return new URL(exampleFolderPath, import.meta.url);
};

export function getDocsPagesList(pages: DocsPage[]) {
    return pages.filter(ignoreUnderscoreFiles);
}

export const getAllDocsExampleFileList = async () => {
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

export function getDocsPages(pages: DocsPage[]) {
    const frameworkPages = FRAMEWORKS.map((framework) => {
        return getDocsPagesList(pages).map((page) => {
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
export const getDocsExampleUrl = ({
    internalFramework,
    pageName,
    exampleName,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}) => {
    return pathJoin(SITE_BASE_URL, internalFramework, pageName, 'examples', exampleName);
};

/**
 * Dynamic path where examples are with relative path for script files
 */
export const getDocsExampleUrlWithRelativePath = ({
    internalFramework,
    pageName,
    exampleName,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}) => {
    return pathJoin(SITE_BASE_URL, internalFramework, pageName, 'examples', exampleName, 'relative-path');
};

/**
 * Get endpoint for all example files
 */
export const getDocsExampleContentsUrl = ({
    internalFramework,
    pageName,
    exampleName,
}: {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}) => {
    return pathJoin(
        getDocsExampleUrl({
            internalFramework,
            pageName,
            exampleName,
        }),
        'contents'
    );
};

/**
 * Dynamic path where example files are
 */
export const getDocsExampleFileUrl = ({
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
    return pathJoin(
        getDocsExampleUrl({
            internalFramework,
            pageName,
            exampleName,
        }),
        fileName
    );
};

export const getDevFileUrl = ({ filePath }: { filePath: string }) => {
    return pathJoin(SITE_BASE_URL, DEV_FILE_BASE_PATH, filePath);
};

export const getDemoExampleUrl = (demoExampleName: string) => {
    return pathJoin(SITE_BASE_URL, 'demo', demoExampleName);
};

export const getDemoPageHashUrl = (categoryId: string) => {
    return pathJoin(SITE_BASE_URL, 'demo', `#${categoryId}`);
};

export const getDevFileList = () => {
    const distFolder = getRootUrl();
    return Object.values(DEV_FILE_PATH_MAP).map((file) => {
        return pathJoin(distFolder.pathname, file);
    });
};

/**
 * Get url of example boiler plate files
 */
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

    const boilerplatePath = pathJoin(
        SITE_BASE_URL,
        '/example-runner',
        `${library}-${boilerPlateFramework}-boilerplate`
    );

    return boilerplatePath;
};

export const getInternalFrameworkExamples = async ({
    pages,
}: {
    pages: DocsPage[];
}): Promise<InternalFrameworkExample[]> => {
    const internalFrameworkPageNames = INTERNAL_FRAMEWORKS.map((internalFramework) => {
        return pages.map((page) => {
            return { internalFramework, pageName: page.slug };
        });
    }).flat();

    const examplePromises = internalFrameworkPageNames.map(async ({ internalFramework, pageName }) => {
        const docsExamplesPathUrl = getDocsExamplesPathUrl({
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

/**
 * Get dev files for local development
 */
export function getDevFiles(): DevFileRoute[] {
    const files = Object.keys(DEV_FILE_PATH_MAP).map((filePath) => {
        const sourceFilePath = DEV_FILE_PATH_MAP[filePath];
        const fullFilePath = pathJoin(getRootUrl().pathname, sourceFilePath);

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
