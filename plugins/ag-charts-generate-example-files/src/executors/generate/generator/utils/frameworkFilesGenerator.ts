import prettier from 'prettier';

import { ANGULAR_GENERATED_MAIN_FILE_NAME } from '../constants';
import { vanillaToAngular } from '../transformation-scripts/chart-vanilla-to-angular';
import { vanillaToReactFunctional } from '../transformation-scripts/chart-vanilla-to-react-functional';
import { vanillaToReactFunctionalTs } from '../transformation-scripts/chart-vanilla-to-react-functional-ts';
import { vanillaToVue3 } from '../transformation-scripts/chart-vanilla-to-vue3';
import { readAsJsFile } from '../transformation-scripts/parser-utils';
import type { InternalFramework } from '../types';
import type { FileContents } from '../types';
import { deepCloneObject } from './deepCloneObject';
import { getBoilerPlateFiles, getEntryFileName, getMainFileName } from './fileUtils';
import { getDarkModeSnippet } from './getDarkModeSnippet';

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

type ConfigGenerator = ({
    entryFile,
    indexHtml,
    isEnterprise,
    bindings,
    typedBindings,
    otherScriptFiles,
    ignoreDarkMode,
    isDev,
}: {
    entryFile: string;
    indexHtml: string;
    isEnterprise: boolean;
    bindings: any;
    typedBindings: any;
    otherScriptFiles: FileContents;
    ignoreDarkMode?: boolean;
    isDev: boolean;
}) => Promise<FrameworkFiles>;

export const frameworkFilesGenerator: Record<InternalFramework, ConfigGenerator> = {
    vanilla: async ({ entryFile, indexHtml, typedBindings, otherScriptFiles, ignoreDarkMode }) => {
        const internalFramework: InternalFramework = 'vanilla';
        const entryFileName = getEntryFileName(internalFramework)!;
        const mainFileName = getMainFileName(internalFramework)!;
        let mainJs = readAsJsFile(entryFile);

        const localeImports = typedBindings.imports
            .filter((i: any) => i.module.includes('ag-charts-locale'))
            .flatMap((imp) => imp.imports);
        if (localeImports.length > 0) {
            mainJs = `const { ${localeImports.join(', ')} } = agChartsLocale;` + '\n' + mainJs;
        }

        // Chart classes that need scoping
        const chartsExports = new Set([
            'time',
            'AgCharts',
            'VERSION',
            'Marker',
            'AG_CHARTS_LOCALE_EN_US',
            '_Scene',
            '_Theme',
            '_Scale',
            '_Util',
            '_ModuleSupport',
        ]);
        const chartImports = typedBindings.imports
            .filter((i: any) => i.module.includes('ag-charts-community') || i.module.includes('ag-charts-enterprise'))
            .flatMap((imp) => imp.imports)
            .filter((imp) => chartsExports.has(imp));
        if (chartImports.length > 0) {
            mainJs = `const { ${chartImports.join(', ')} } = agCharts;` + '\n' + mainJs;
        }

        if (localeImports.length > 0 || chartImports.length > 0) {
            mainJs = '\n' + mainJs;
        }

        // add website dark mode handling code to doc examples - this code is later striped out from the code viewer / plunker
        if (!ignoreDarkMode) {
            mainJs = mainJs + '\n\n' + getDarkModeSnippet({ chartAPI: 'AgCharts' });
        }

        mainJs = await prettier.format(mainJs, {
            parser: 'babel',
            embeddedLanguageFormatting: 'off',
        });

        return {
            files: {
                ...otherScriptFiles,
                [entryFileName]: mainJs,
                'index.html': indexHtml,
            },
            scriptFiles: Object.keys(otherScriptFiles).concat(entryFileName),
            entryFileName,
            mainFileName,
        };
    },
    typescript: async ({ entryFile, indexHtml, otherScriptFiles, bindings, ignoreDarkMode, isDev }) => {
        const internalFramework: InternalFramework = 'typescript';
        const entryFileName = getEntryFileName(internalFramework)!;
        const mainFileName = getMainFileName(internalFramework)!;

        const { externalEventHandlers } = bindings;
        const boilerPlateFiles = await getBoilerPlateFiles(isDev, internalFramework);

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

        let mainTs = externalEventHandlersCode ? `${entryFile}${externalEventHandlersCode}` : entryFile;

        const chartAPI = 'AgCharts';
        if (!mainTs.includes(`chart = ${chartAPI}`)) {
            mainTs = mainTs.replace(`${chartAPI}.create(options);`, `const chart = ${chartAPI}.create(options);`);
        }

        // add website dark mode handling code to doc examples - this code is later striped out from the code viewer / plunker
        if (!ignoreDarkMode) {
            mainTs = mainTs + '\n' + getDarkModeSnippet({ chartAPI });
        }

        mainTs = await prettier.format(mainTs, {
            parser: 'typescript',
            embeddedLanguageFormatting: 'off',
        });

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
    reactFunctional: async ({ bindings, indexHtml, otherScriptFiles, isDev, ignoreDarkMode }) => {
        const internalFramework = 'reactFunctional';
        const entryFileName = getEntryFileName(internalFramework)!;
        const mainFileName = getMainFileName(internalFramework)!;
        const boilerPlateFiles = await getBoilerPlateFiles(isDev, internalFramework);

        let indexJsx = await vanillaToReactFunctional(deepCloneObject(bindings), []);

        // add website dark mode handling code to doc examples - this code is later striped out from the code viewer / plunker
        if (!ignoreDarkMode) {
            indexJsx = indexJsx + '\n' + getDarkModeSnippet();
        }

        indexJsx = await prettier.format(indexJsx, {
            parser: 'babel',
            embeddedLanguageFormatting: 'off',
        });

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
    reactFunctionalTs: async ({ typedBindings, indexHtml, otherScriptFiles, ignoreDarkMode, isDev }) => {
        const internalFramework: InternalFramework = 'reactFunctionalTs';
        const entryFileName = getEntryFileName(internalFramework)!;
        const mainFileName = getMainFileName(internalFramework)!;
        const boilerPlateFiles = await getBoilerPlateFiles(isDev, internalFramework);

        let indexTsx = await vanillaToReactFunctionalTs(deepCloneObject(typedBindings), []);

        // add website dark mode handling code to doc examples - this code is later striped out from the code viewer / plunker
        if (!ignoreDarkMode) {
            indexTsx = indexTsx + '\n' + getDarkModeSnippet();
        }

        indexTsx = await prettier.format(indexTsx, {
            parser: 'typescript',
            embeddedLanguageFormatting: 'off',
        });

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
    angular: async ({ typedBindings, otherScriptFiles, isDev, ignoreDarkMode }) => {
        const internalFramework: InternalFramework = 'angular';
        const entryFileName = getEntryFileName(internalFramework)!;
        const mainFileName = getMainFileName(internalFramework)!;
        const boilerPlateFiles = await getBoilerPlateFiles(isDev, internalFramework);

        let appComponent = await vanillaToAngular(deepCloneObject(typedBindings), []);

        // add website dark mode handling code to doc examples - this code is later striped out from the code viewer / plunker
        if (!ignoreDarkMode) {
            appComponent = appComponent + '\n' + getDarkModeSnippet();
        }

        appComponent = await prettier.format(appComponent, {
            parser: 'typescript',
            embeddedLanguageFormatting: 'off',
        });

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
    vue3: async ({ bindings, indexHtml, otherScriptFiles, isDev, ignoreDarkMode }) => {
        const internalFramework: InternalFramework = 'vue3';
        const boilerPlateFiles = await getBoilerPlateFiles(isDev, internalFramework);

        let mainJs = await vanillaToVue3(deepCloneObject(bindings), []);

        // add website dark mode handling code to doc examples - this code is later striped out from the code viewer / plunker
        if (!ignoreDarkMode) {
            mainJs = mainJs + '\n' + getDarkModeSnippet();
        }

        mainJs = await prettier.format(mainJs, {
            parser: 'babel',
            embeddedLanguageFormatting: 'off',
        });

        const entryFileName = getEntryFileName(internalFramework)!;
        const mainFileName = getMainFileName(internalFramework)!;

        return {
            files: {
                ...otherScriptFiles,
                [entryFileName]: mainJs,
                'index.html': indexHtml,
            },
            boilerPlateFiles,
            // Other files, not including entry file
            scriptFiles: Object.keys(otherScriptFiles),
            entryFileName,
            mainFileName,
        };
    },
};
