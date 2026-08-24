import type { InternalFramework } from '@ag-grid-types';
import {
    type GeneratedExampleParams,
    getGeneratedContents,
    getGeneratedContentsFileList,
} from '@components/example-generator';
import { FRAMEWORKS } from '@constants';
import { getIsBenchmarkOnlyBuild } from '@utils/env';
import { isTransformableModule, toModuleFileName } from '@utils/example-modules/transformExampleModule';
import type { DocsPage } from '@utils/pages';

import { getInternalFrameworkExamples, getPagesList } from './filesData';

type DocExamplePages = Awaited<ReturnType<typeof getDocsExamplePages>>;
type DocExamplePage = DocExamplePages[number]['params'] & {
    isEnterprise: boolean;
    isIntegratedCharts?: boolean;
    isLocale?: boolean;
    hasExampleConsoleLog?: boolean;
    hasExampleControls?: boolean;
    sourceFileList?: string[];
};
type DocFrameworkExamples = Record<InternalFramework, DocExamplePage>;

export function getDocsPages(pages: DocsPage[]) {
    const frameworkPages = FRAMEWORKS.flatMap((framework) => {
        return getPagesList(pages).map((page) => {
            return {
                framework,
                pageName: page.id,
                page,
            };
        });
    });

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

export function getDocsFrameworkPages() {
    if (getIsBenchmarkOnlyBuild()) return [];
    return FRAMEWORKS.map((framework) => {
        return {
            params: {
                framework,
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

function allPropertiesAreTruthy(entries: [string, DocExamplePage][], property: keyof DocExamplePage) {
    return entries.every(([_, data]) => {
        return data[property];
    });
}

function flattenDocsExampleContents(data: Record<string, DocFrameworkExamples>) {
    return Object.values(data).map((frameworkExamples) => {
        // eslint-disable-next-line no-restricted-properties
        const frameworkEntries = Object.entries(frameworkExamples);
        const [_, { pageName, exampleName, sourceFileList }] = frameworkEntries[0];
        const isEnterprise = allPropertiesAreTruthy(frameworkEntries, 'isEnterprise');
        const isIntegratedCharts = allPropertiesAreTruthy(frameworkEntries, 'isIntegratedCharts');
        const isLocale = allPropertiesAreTruthy(frameworkEntries, 'isLocale');
        const hasExampleConsoleLog = allPropertiesAreTruthy(frameworkEntries, 'hasExampleConsoleLog');
        const hasExampleControls = allPropertiesAreTruthy(frameworkEntries, 'hasExampleControls');

        return {
            id: `${pageName}-${exampleName}`,
            pageName,
            exampleName,
            sourceFileList,
            isEnterprise,
            isIntegratedCharts,
            isLocale,
            hasExampleConsoleLog,
            hasExampleControls,
            frameworkExamples,
        };
    });
}

export async function getDocsExampleContents({ pages }: { pages: DocsPage[] }) {
    const examples = await getDocsExamplePages({
        pages,
    });

    const exampleContents: Record<string, DocFrameworkExamples> = {};
    const examplePromises = examples.map(async (example) => {
        const { internalFramework, pageName, exampleName } = example.params;
        const key = `${pageName}-${exampleName}`;
        if (!exampleContents[key]) {
            exampleContents[key] = {} as DocFrameworkExamples;
        }
        const generatedExampleParams: GeneratedExampleParams = {
            type: 'docs',
            framework: internalFramework,
            pageName,
            exampleName,
        };
        const contents = await getGeneratedContents(generatedExampleParams);

        exampleContents[key][internalFramework] = {
            isEnterprise: contents?.isEnterprise,
            isIntegratedCharts: contents?.isIntegratedCharts,
            isLocale: contents?.isLocale,
            hasExampleConsoleLog: contents?.hasExampleConsoleLog,
            hasExampleControls: contents?.hasExampleControls,
            sourceFileList: contents?.sourceFileList,
            ...example.params,
        };
    });
    await Promise.all(examplePromises);

    return flattenDocsExampleContents(exampleContents);
}

export async function getDocExampleFiles({ pages }: { pages: DocsPage[] }) {
    const examples = await getInternalFrameworkExamples({ pages });
    const exampleFilesPromises = examples.map(async ({ internalFramework, pageName, exampleName }) => {
        const exampleFileList = await getGeneratedContentsFileList({
            type: 'docs',
            framework: internalFramework,
            pageName,
            exampleName,
        });

        return exampleFileList.flatMap((fileName) => {
            const entry = {
                internalFramework,
                pageName,
                exampleName,
                fileName,
            };

            // Transpilable sources are also served transpiled, under a `.js` name, as
            // that is what the natively loaded example modules import
            return isTransformableModule(fileName)
                ? [entry, { ...entry, fileName: toModuleFileName(fileName) }]
                : [entry];
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
