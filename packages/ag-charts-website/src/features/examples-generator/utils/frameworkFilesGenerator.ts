import type { InternalFramework } from '../../../types/ag-grid';
import { readAsJsFile } from '../transformation-scripts/parser-utils';
import { vanillaToReact } from '../transformation-scripts/chart-vanilla-to-react';
import { vanillaToReactFunctional } from '../transformation-scripts/chart-vanilla-to-react-functional';
import { vanillaToReactFunctionalTs } from '../transformation-scripts/chart-vanilla-to-react-functional-ts';
import { getBoilerPlateFiles } from './fileUtils';
import { deepCloneObject } from './deepCloneObject';

interface FrameworkFiles {
    files: Record<string, string>;
    boilerPlateFiles?: Record<string, string>;
    scriptFiles: string[];
    entryFileName: string;
}

type ConfigGenerator = ({
    entryFile,
    indexHtml,
    isEnterprise,
    bindings,
    typedBindings,
}: {
    entryFile: string;
    indexHtml: string;
    isEnterprise: boolean;
    bindings: any;
    typedBindings: any;
}) => FrameworkFiles | Promise<FrameworkFiles>;

const createReactFilesGenerator =
    ({
        sourceGenerator,
        internalFramework,
    }: {
        sourceGenerator: (bindings: any, componentFilenames: string[]) => () => string;
        internalFramework: InternalFramework;
    }): ConfigGenerator =>
    async ({ entryFile, bindings, indexHtml }) => {
        const boilerPlateFiles = await getBoilerPlateFiles(internalFramework);

        const getSource = sourceGenerator(deepCloneObject(bindings), []);
        const indexJsx = getSource();

        return {
            files: {
                'index.jsx': indexJsx,
                'index.html': indexHtml,
            },
            boilerPlateFiles,
            scriptFiles: ['index.jsx'],
            entryFileName: 'index.jsx',
        };
    };

export const frameworkFilesGenerator: Record<InternalFramework, ConfigGenerator> = {
    vanilla: ({ entryFile, indexHtml, typedBindings, isEnterprise }) => {
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
                'main.js': mainJs,
                'index.html': indexHtml,
            },
            scriptFiles: ['main.js'],
            entryFileName: 'main.js',
        };
    },
    typescript: async ({ entryFile, indexHtml }) => {
        const boilerPlateFiles = await getBoilerPlateFiles('typescript');
        return {
            files: {
                'main.ts': entryFile,
                'index.html': indexHtml,
            },
            boilerPlateFiles,
            scriptFiles: ['main.ts'],
            entryFileName: 'main.ts',
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
    reactFunctionalTs: async ({ entryFile, typedBindings, indexHtml }) => {
        const boilerPlateFiles = await getBoilerPlateFiles('reactFunctionalTs');

        const getSource = vanillaToReactFunctionalTs(deepCloneObject(typedBindings), []);
        const indexJsx = getSource();

        return {
            files: {
                'index.tsx': indexJsx,
                'index.html': indexHtml,
            },
            boilerPlateFiles,
            scriptFiles: ['index.tsx'],
            entryFileName: 'index.tsx',
        };
    },
    angular: () => ({ files: {}, scriptFiles: [], entryFileName: '' }),
    vue: () => ({ files: {}, scriptFiles: [], entryFileName: '' }),
    vue3: () => ({ files: {}, scriptFiles: [], entryFileName: '' }),
};
