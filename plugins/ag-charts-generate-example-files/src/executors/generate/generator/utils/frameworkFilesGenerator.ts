import prettier from 'prettier';

import { ANGULAR_GENERATED_MAIN_FILE_NAME } from '../constants';
import { vanillaToAngular } from '../transformation-scripts/chart-vanilla-to-angular';
import { vanillaToReactFunctional } from '../transformation-scripts/chart-vanilla-to-react-functional';
import { vanillaToReactFunctionalTs } from '../transformation-scripts/chart-vanilla-to-react-functional-ts';
import { vanillaToTypescript } from '../transformation-scripts/chart-vanilla-to-typescript';
import { vanillaToVue3 } from '../transformation-scripts/chart-vanilla-to-vue3';
import { readAsJsFile } from '../transformation-scripts/parser-utils';
import type { FileContents, InternalFramework } from '../types';
import { deepCloneObject } from './deepCloneObject';
import { getBoilerPlateFiles, getEntryFileName, getMainFileName } from './fileUtils';

/**
 * Get commented UMD script tags for staging and production URLs
 * Only used in dev mode for vanilla examples
 */
const getUmdScriptTags = (isEnterprise: boolean): string => {
    const stagingUrl = isEnterprise
        ? 'https://charts-staging.ag-grid.com/dev/ag-charts-enterprise/dist/umd/ag-charts-enterprise.js'
        : 'https://charts-staging.ag-grid.com/dev/ag-charts-community/dist/umd/ag-charts-community.js';
    const productionUrl = isEnterprise
        ? 'https://cdn.jsdelivr.net/npm/ag-charts-enterprise@13.0.0/dist/umd/ag-charts-enterprise.js'
        : 'https://cdn.jsdelivr.net/npm/ag-charts-community@latest/dist/umd/ag-charts-community.js';

    return `<!-- <script src="${stagingUrl}"></script> -->
<!-- <script src="${productionUrl}"></script> -->`;
};

interface FrameworkFiles {
    files: FileContents;
    boilerPlateFiles?: FileContents;
    hasProvidedExamples?: boolean;
    scriptFiles?: string[];
    /**
     * Filename to execute code
     */
    entryFileName: string;
    /**
     * Filename of main code that is run
     */
    mainFileName: string;
}

export type TransformEntryFile = (params: { entryFile: string; chartAPI?: string }) => string;
type ConfigGenerator = ({
    entryFile,
    indexHtml,
    isEnterprise,
    bindings,
    typedBindings,
    otherScriptFiles,
    styleFileNames,
    transformEntryFile,
    isDev,
    suppressOptionsClone,
}: {
    entryFile: string;
    indexHtml: string;
    isEnterprise: boolean;
    bindings: any;
    typedBindings: { imports: { module: string[]; imports: string[] }[] };
    otherScriptFiles: FileContents;
    styleFileNames: string[];
    transformEntryFile?: TransformEntryFile;
    isDev: boolean;
    suppressOptionsClone?: boolean;
}) => Promise<FrameworkFiles>;

// noinspection TypeScriptValidateTypes
export const frameworkFilesGenerator: Record<InternalFramework, ConfigGenerator> = {
    vanilla: async ({ entryFile, indexHtml, isEnterprise, typedBindings, otherScriptFiles, transformEntryFile, isDev }) => {
        const internalFramework: InternalFramework = 'vanilla';
        const entryFileName = getEntryFileName(internalFramework);
        const mainFileName = getMainFileName(internalFramework);
        // Strip ModuleRegistry calls (including multi-line) - vanilla uses UMD bundle with pre-registered modules
        let mainJs = readAsJsFile(entryFile).replace(/ModuleRegistry\.registerModules\([\s\S]*?\);/m, '');

        const localeImports = typedBindings.imports
            .filter((i: any) => i.module.includes('ag-charts-locale'))
            .flatMap((imp) => imp.imports);
        if (localeImports.length > 0) {
            mainJs = `const { ${localeImports.join(', ')} } = agChartsLocale;` + '\n' + mainJs;
        }

        // Chart classes that need scoping
        const chartsExports = new Set(['time', 'AgCharts', 'VERSION', 'Marker', 'AG_CHARTS_LOCALE_EN_US']);
        const chartImports = typedBindings.imports
            .filter((i) => i.module.includes('ag-charts-community') || i.module.includes('ag-charts-enterprise'))
            .flatMap((imp) => imp.imports)
            .filter((imp) => chartsExports.has(imp));
        if (chartImports.length > 0) {
            mainJs = `const { ${chartImports.join(', ')} } = agCharts;` + '\n' + mainJs;
        }

        if (localeImports.length > 0 || chartImports.length > 0) {
            mainJs = '\n' + mainJs;
        }

        if (transformEntryFile) {
            mainJs = transformEntryFile({ entryFile: mainJs, chartAPI: 'AgCharts' });
        }

        if (!isDev) {
            mainJs = await prettier.format(mainJs, {
                parser: 'babel',
                embeddedLanguageFormatting: 'off',
            });
        }

        // Inject commented UMD script tags for dev builds
        let processedIndexHtml = indexHtml;
        if (isDev) {
            const umdScriptTags = getUmdScriptTags(isEnterprise);
            // Check if tags are already present (idempotent)
            if (!indexHtml.includes('<!-- Staging UMD build -->')) {
                // Inject before closing </head> tag if present, otherwise before closing </html>, otherwise append
                if (indexHtml.includes('</head>')) {
                    processedIndexHtml = indexHtml.replace('</head>', `${umdScriptTags}\n</head>`);
                } else if (indexHtml.includes('</html>')) {
                    processedIndexHtml = indexHtml.replace('</html>', `${umdScriptTags}\n</html>`);
                } else {
                    processedIndexHtml = indexHtml + '\n' + umdScriptTags;
                }
            }
        }

        return {
            files: {
                ...otherScriptFiles,
                [entryFileName]: mainJs,
                'index.html': processedIndexHtml,
            },
            scriptFiles: Object.keys(otherScriptFiles).concat(entryFileName),
            entryFileName,
            mainFileName,
        };
    },
    typescript: async ({ indexHtml, otherScriptFiles, bindings, typedBindings, transformEntryFile, isDev }) => {
        const internalFramework: InternalFramework = 'typescript';
        const entryFileName = getEntryFileName(internalFramework);
        const mainFileName = getMainFileName(internalFramework);

        const { externalEventHandlers } = bindings;
        const boilerPlateFiles = await getBoilerPlateFiles(isDev, internalFramework);

        let mainTs = vanillaToTypescript(deepCloneObject(typedBindings));

        // Attach external event handlers
        let externalEventHandlersCode;
        if (externalEventHandlers?.length > 0) {
            const externalBindings = externalEventHandlers.map((e) => `   (<any>window).${e.name} = ${e.name};`);
            externalEventHandlersCode = [
                '\n',
                "if (typeof window !== 'undefined') {",
                '// Attach external event handlers to window so they can be called from index.html',
                ...externalBindings,
                '}',
            ].join('\n');
        }

        if (externalEventHandlersCode) {
            mainTs = `${mainTs}\n${externalEventHandlersCode}`;
        }

        if (transformEntryFile) {
            mainTs = transformEntryFile({ entryFile: mainTs, chartAPI: 'AgCharts' });
        }

        if (!isDev) {
            mainTs = await prettier.format(mainTs, {
                parser: 'typescript',
                embeddedLanguageFormatting: 'off',
            });
        }

        return {
            files: {
                ...otherScriptFiles,
                [entryFileName]: mainTs,
                'index.html': indexHtml,
            },
            boilerPlateFiles,
            // NOTE: `scriptFiles` not required, as system js handles import
            entryFileName,
            mainFileName,
        };
    },
    reactFunctional: async ({
        bindings,
        indexHtml,
        otherScriptFiles,
        styleFileNames,
        isDev,
        transformEntryFile,
        suppressOptionsClone,
    }) => {
        const internalFramework = 'reactFunctional';
        const entryFileName = getEntryFileName(internalFramework);
        const mainFileName = getMainFileName(internalFramework);
        const boilerPlateFiles = await getBoilerPlateFiles(isDev, internalFramework);

        let indexJsx = await vanillaToReactFunctional(
            deepCloneObject(bindings),
            [],
            styleFileNames,
            suppressOptionsClone
        );

        if (transformEntryFile) {
            indexJsx = transformEntryFile({ entryFile: indexJsx });
        }

        if (!isDev) {
            indexJsx = await prettier.format(indexJsx, {
                parser: 'babel',
                embeddedLanguageFormatting: 'off',
            });
        }

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
            mainFileName,
        };
    },
    reactFunctionalTs: async ({
        typedBindings,
        indexHtml,
        otherScriptFiles,
        styleFileNames,
        transformEntryFile,
        isDev,
        suppressOptionsClone,
    }) => {
        const internalFramework: InternalFramework = 'reactFunctionalTs';
        const entryFileName = getEntryFileName(internalFramework);
        const mainFileName = getMainFileName(internalFramework);
        const boilerPlateFiles = await getBoilerPlateFiles(isDev, internalFramework);

        let indexTsx = await vanillaToReactFunctionalTs(
            deepCloneObject(typedBindings),
            [],
            styleFileNames,
            suppressOptionsClone
        );

        if (transformEntryFile) {
            indexTsx = transformEntryFile({ entryFile: indexTsx });
        }

        if (!isDev) {
            indexTsx = await prettier.format(indexTsx, {
                parser: 'typescript',
                embeddedLanguageFormatting: 'off',
            });
        }

        return {
            files: {
                ...otherScriptFiles,
                [entryFileName]: indexTsx,
                'index.html': indexHtml,
            },
            boilerPlateFiles,
            // NOTE: `scriptFiles` not required, as system js handles import
            entryFileName,
            mainFileName,
        };
    },
    angular: async ({ typedBindings, otherScriptFiles, isDev, transformEntryFile, suppressOptionsClone }) => {
        const internalFramework: InternalFramework = 'angular';
        const entryFileName = getEntryFileName(internalFramework);
        const mainFileName = getMainFileName(internalFramework);
        const boilerPlateFiles = await getBoilerPlateFiles(isDev, internalFramework);

        let appComponent = await vanillaToAngular(deepCloneObject(typedBindings), [], suppressOptionsClone);

        if (transformEntryFile) {
            appComponent = transformEntryFile({ entryFile: appComponent });
        }

        if (!isDev) {
            appComponent = await prettier.format(appComponent, {
                parser: 'typescript',
                embeddedLanguageFormatting: 'off',
            });
        }

        return {
            files: {
                ...otherScriptFiles,
                // NOTE: No `index.html` as the contents are generated in the `app.component` file
                // NOTE: Duplicating entrypoint boilerplate file here, so examples
                // load from the same directory as these files, rather than
                // boilerplate files
                [entryFileName]: boilerPlateFiles[entryFileName],
                [ANGULAR_GENERATED_MAIN_FILE_NAME]: appComponent,
            },
            boilerPlateFiles,
            entryFileName,
            mainFileName,
        };
    },
    vue3: async ({ bindings, indexHtml, otherScriptFiles, isDev, transformEntryFile, suppressOptionsClone }) => {
        const internalFramework: InternalFramework = 'vue3';
        const entryFileName = getEntryFileName(internalFramework);
        const mainFileName = getMainFileName(internalFramework);
        const boilerPlateFiles = await getBoilerPlateFiles(isDev, internalFramework);

        let mainJs = await vanillaToVue3(deepCloneObject(bindings), [], suppressOptionsClone);

        if (transformEntryFile) {
            mainJs = transformEntryFile({ entryFile: mainJs });
        }

        if (!isDev) {
            mainJs = await prettier.format(mainJs, {
                parser: 'typescript',
                embeddedLanguageFormatting: 'off',
            });
        }

        return {
            files: {
                ...otherScriptFiles,
                [entryFileName]: mainJs,
                'index.html': indexHtml,
            },
            boilerPlateFiles,
            entryFileName,
            mainFileName,
        };
    },
};
