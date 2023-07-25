import type { InternalFramework } from '../../../types/ag-grid';
import { readAsJsFile } from '../transformation-scripts/parser-utils';
import { vanillaToReact } from '../transformation-scripts/chart-vanilla-to-react';
import { vanillaToReactFunctional } from '../transformation-scripts/chart-vanilla-to-react-functional';
import { vanillaToReactFunctionalTs } from '../transformation-scripts/chart-vanilla-to-react-functional-ts';
import { getBoilerPlateFiles, getEntryFileName } from './fileUtils';
import { deepCloneObject } from './deepCloneObject';

interface FrameworkFiles {
    files: Record<string, string>;
    boilerPlateFiles?: Record<string, string>;
    scriptFiles?: string[];
    entryFileName: string;
}

type ConfigGenerator = ({
    entryFile,
    indexHtml,
    isEnterprise,
    bindings,
    typedBindings,
    otherScriptFiles,
}: {
    entryFile: string;
    indexHtml: string;
    isEnterprise: boolean;
    bindings: any;
    typedBindings: any;
    otherScriptFiles: Record<string, string>;
}) => FrameworkFiles | Promise<FrameworkFiles>;

const createReactFilesGenerator =
    ({
        sourceGenerator,
        internalFramework,
    }: {
        sourceGenerator: (bindings: any, componentFilenames: string[]) => () => string;
        internalFramework: InternalFramework;
    }): ConfigGenerator =>
    async ({ bindings, indexHtml, otherScriptFiles }) => {
        const entryFileName = getEntryFileName(internalFramework)!;
        const boilerPlateFiles = await getBoilerPlateFiles(internalFramework);

        const getSource = sourceGenerator(deepCloneObject(bindings), []);
        const indexJsx = getSource();

        return {
            files: {
                ...otherScriptFiles,
                [entryFileName]: indexJsx,
                'index.html': indexHtml,
            },
            boilerPlateFiles,
            // Other files, not including entry file
            scriptFiles: Object.keys(otherScriptFiles),
            entryFileName,
        };
    };

export const frameworkFilesGenerator: Record<InternalFramework, ConfigGenerator> = {
    vanilla: ({ entryFile, indexHtml, typedBindings, isEnterprise, otherScriptFiles }) => {
        const entryFileName = getEntryFileName('vanilla')!;
        let mainJs = readAsJsFile(entryFile);

        // replace Typescript new Grid( with Javascript new agGrid.Grid(
        mainJs = mainJs.replace(/new Grid\(/g, 'new agGrid.Grid(');

        // Chart classes that need scoping
        const chartImports = typedBindings.imports.find(
            (i: any) => i.module.includes('ag-charts-community') || i.module.includes('ag-charts-enterprise')
        );
        if (chartImports) {
            chartImports.imports.forEach((i: any) => {
                const toReplace = `(?<!\\.)${i}([\\s/.])`;
                const reg = new RegExp(toReplace, 'g');
                mainJs = mainJs.replace(reg, `${isEnterprise ? 'agChartsEnterprise' : 'agCharts'}.${i}$1`);
            });
        }

        return {
            files: {
                ...otherScriptFiles,
                [entryFileName]: mainJs,
                'index.html': indexHtml,
            },
            scriptFiles: Object.keys(otherScriptFiles).concat(entryFileName),
            entryFileName,
        };
    },
    typescript: async ({ entryFile, indexHtml, otherScriptFiles, bindings }) => {
        const internalFramework: InternalFramework = 'typescript';
        const entryFileName = getEntryFileName(internalFramework)!;

        const { externalEventHandlers } = bindings;
        const boilerPlateFiles = await getBoilerPlateFiles(internalFramework);

        // Attach external event handlers
        let externalEventHandlersCode;
        if (externalEventHandlers?.length > 0) {
            const externalBindings = externalEventHandlers.map((e) => ` (<any>window).${e.name} = ${e.name};`);
            externalEventHandlersCode = [
                '\n',
                "if (typeof window !== 'undefined') {",
                '// Attach external event handlers to window so they can be called from index.html',
                ...externalBindings,
                '}',
            ].join('\n');
        }

        const mainTsx = externalEventHandlersCode ? `${entryFile}${externalEventHandlersCode}` : entryFile;

        return {
            files: {
                ...otherScriptFiles,
                [entryFileName]: mainTsx,
                'index.html': indexHtml,
            },
            boilerPlateFiles,
            // NOTE: `scriptFiles` not required, as system js handles import
            entryFileName,
        };
    },
    react: createReactFilesGenerator({
        sourceGenerator: vanillaToReact,
        internalFramework: 'react',
    }),
    reactFunctional: createReactFilesGenerator({
        sourceGenerator: vanillaToReactFunctional,
        internalFramework: 'reactFunctional',
    }),
    reactFunctionalTs: async ({ typedBindings, indexHtml, otherScriptFiles }) => {
        const internalFramework: InternalFramework = 'reactFunctionalTs';
        const entryFileName = getEntryFileName(internalFramework)!;
        const boilerPlateFiles = await getBoilerPlateFiles(internalFramework);

        const getSource = vanillaToReactFunctionalTs(deepCloneObject(typedBindings), []);
        const indexTsx = getSource();

        return {
            files: {
                ...otherScriptFiles,
                [entryFileName]: indexTsx,
                'index.html': indexHtml,
            },
            boilerPlateFiles,
            // NOTE: `scriptFiles` not required, as system js handles import
            entryFileName,
        };
    },
    angular: () => ({ files: {}, scriptFiles: [], entryFileName: '' }),
    vue: () => ({ files: {}, scriptFiles: [], entryFileName: '' }),
    vue3: () => ({ files: {}, scriptFiles: [], entryFileName: '' }),
};
