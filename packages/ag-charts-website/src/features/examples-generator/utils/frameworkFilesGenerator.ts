import type { InternalFramework } from '../../../types/ag-grid';
import { readAsJsFile } from '../transformation-scripts/parser-utils';
import { getBoilerPlateFiles } from './fileUtils';

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
    react: () => ({ files: {}, scriptFiles: [], entryFileName: '' }),
    reactFunctional: () => ({ files: {}, scriptFiles: [], entryFileName: '' }),
    reactFunctionalTs: () => ({ files: {}, scriptFiles: [], entryFileName: '' }),
    angular: () => ({ files: {}, scriptFiles: [], entryFileName: '' }),
    vue: () => ({ files: {}, scriptFiles: [], entryFileName: '' }),
    vue3: () => ({ files: {}, scriptFiles: [], entryFileName: '' }),
};
