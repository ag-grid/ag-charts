"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "frameworkFilesGenerator", {
    enumerable: true,
    get: function() {
        return frameworkFilesGenerator;
    }
});
const _extends = require("@swc/helpers/_/_extends");
const _interop_require_default = require("@swc/helpers/_/_interop_require_default");
const _prettier = /*#__PURE__*/ _interop_require_default._(require("prettier"));
const _constants = require("../constants");
const _chartvanillatoangular = require("../transformation-scripts/chart-vanilla-to-angular");
const _chartvanillatoreactfunctional = require("../transformation-scripts/chart-vanilla-to-react-functional");
const _chartvanillatoreactfunctionalts = require("../transformation-scripts/chart-vanilla-to-react-functional-ts");
const _chartvanillatovue = require("../transformation-scripts/chart-vanilla-to-vue");
const _chartvanillatovue3 = require("../transformation-scripts/chart-vanilla-to-vue3");
const _parserutils = require("../transformation-scripts/parser-utils");
const _deepCloneObject = require("./deepCloneObject");
const _fileUtils = require("./fileUtils");
const _getDarkModeSnippet = require("./getDarkModeSnippet");
const createVueFilesGenerator = ({ sourceGenerator, internalFramework })=>async ({ bindings, indexHtml, otherScriptFiles, isDev, ignoreDarkMode })=>{
        const boilerPlateFiles = await (0, _fileUtils.getBoilerPlateFiles)(isDev, internalFramework);
        let mainJs = await sourceGenerator((0, _deepCloneObject.deepCloneObject)(bindings), []);
        // add website dark mode handling code to doc examples - this code is later striped out from the code viewer / plunker
        if (!ignoreDarkMode) {
            mainJs = mainJs + '\n' + (0, _getDarkModeSnippet.getDarkModeSnippet)();
        }
        mainJs = await _prettier.default.format(mainJs, {
            parser: 'babel'
        });
        const entryFileName = (0, _fileUtils.getEntryFileName)(internalFramework);
        const mainFileName = (0, _fileUtils.getMainFileName)(internalFramework);
        return {
            files: _extends._({}, otherScriptFiles, {
                [entryFileName]: mainJs,
                'index.html': indexHtml
            }),
            boilerPlateFiles,
            // Other files, not including entry file
            scriptFiles: Object.keys(otherScriptFiles),
            entryFileName,
            mainFileName
        };
    };
const frameworkFilesGenerator = {
    vanilla: async ({ entryFile, indexHtml, typedBindings, otherScriptFiles, ignoreDarkMode })=>{
        const internalFramework = 'vanilla';
        const entryFileName = (0, _fileUtils.getEntryFileName)(internalFramework);
        const mainFileName = (0, _fileUtils.getMainFileName)(internalFramework);
        let mainJs = (0, _parserutils.readAsJsFile)(entryFile);
        // Chart classes that need scoping
        const chartImports = typedBindings.imports.find((i)=>i.module.includes('ag-charts-community') || i.module.includes('ag-charts-enterprise'));
        if (chartImports) {
            chartImports.imports.forEach((i)=>{
                const toReplace = `(?<!\\.)${i}([\\s/.])`;
                const reg = new RegExp(toReplace, 'g');
                mainJs = mainJs.replace(reg, `agCharts.${i}$1`);
            });
        }
        // add website dark mode handling code to doc examples - this code is later striped out from the code viewer / plunker
        if (!ignoreDarkMode) {
            mainJs = mainJs + `\n
            ${(0, _getDarkModeSnippet.getDarkModeSnippet)({
                chartAPI: 'agCharts.AgCharts'
            })}`;
        }
        mainJs = await _prettier.default.format(mainJs, {
            parser: 'babel'
        });
        return {
            files: _extends._({}, otherScriptFiles, {
                [entryFileName]: mainJs,
                'index.html': indexHtml
            }),
            scriptFiles: Object.keys(otherScriptFiles).concat(entryFileName),
            entryFileName,
            mainFileName
        };
    },
    typescript: async ({ entryFile, indexHtml, otherScriptFiles, bindings, ignoreDarkMode, isDev })=>{
        const internalFramework = 'typescript';
        const entryFileName = (0, _fileUtils.getEntryFileName)(internalFramework);
        const mainFileName = (0, _fileUtils.getMainFileName)(internalFramework);
        const { externalEventHandlers } = bindings;
        const boilerPlateFiles = await (0, _fileUtils.getBoilerPlateFiles)(isDev, internalFramework);
        // Attach external event handlers
        let externalEventHandlersCode;
        if ((externalEventHandlers == null ? void 0 : externalEventHandlers.length) > 0) {
            const externalBindings = externalEventHandlers.map((e)=>`   (<any>window).${e.name} = ${e.name};`);
            externalEventHandlersCode = [
                '\n',
                "if (typeof window !== 'undefined') {",
                '// Attach external event handlers to window so they can be called from index.html',
                ...externalBindings,
                '}'
            ].join('\n');
        }
        let mainTs = externalEventHandlersCode ? `${entryFile}${externalEventHandlersCode}` : entryFile;
        const chartAPI = 'AgCharts';
        if (!mainTs.includes(`chart = ${chartAPI}`)) {
            mainTs = mainTs.replace(`${chartAPI}.create(options);`, `const chart = ${chartAPI}.create(options);`);
        }
        // add website dark mode handling code to doc examples - this code is later striped out from the code viewer / plunker
        if (!ignoreDarkMode) {
            mainTs = mainTs + '\n' + (0, _getDarkModeSnippet.getDarkModeSnippet)({
                chartAPI
            });
        }
        mainTs = await _prettier.default.format(mainTs, {
            parser: 'typescript'
        });
        return {
            files: _extends._({}, otherScriptFiles, {
                [entryFileName]: mainTs,
                'index.html': indexHtml
            }),
            boilerPlateFiles,
            // NOTE: `scriptFiles` not required, as system js handles import
            entryFileName,
            mainFileName
        };
    },
    reactFunctional: async ({ bindings, indexHtml, otherScriptFiles, isDev, ignoreDarkMode })=>{
        const internalFramework = 'reactFunctional';
        const entryFileName = (0, _fileUtils.getEntryFileName)(internalFramework);
        const mainFileName = (0, _fileUtils.getMainFileName)(internalFramework);
        const boilerPlateFiles = await (0, _fileUtils.getBoilerPlateFiles)(isDev, internalFramework);
        let indexJsx = await (0, _chartvanillatoreactfunctional.vanillaToReactFunctional)((0, _deepCloneObject.deepCloneObject)(bindings), []);
        // add website dark mode handling code to doc examples - this code is later striped out from the code viewer / plunker
        if (!ignoreDarkMode) {
            indexJsx = indexJsx + '\n' + (0, _getDarkModeSnippet.getDarkModeSnippet)();
        }
        indexJsx = await _prettier.default.format(indexJsx, {
            parser: 'babel'
        });
        return {
            files: _extends._({}, otherScriptFiles, {
                [entryFileName]: indexJsx,
                'index.html': indexHtml
            }),
            boilerPlateFiles,
            // Other files, not including entry file
            scriptFiles: Object.keys(otherScriptFiles),
            entryFileName,
            mainFileName
        };
    },
    reactFunctionalTs: async ({ typedBindings, indexHtml, otherScriptFiles, ignoreDarkMode, isDev })=>{
        const internalFramework = 'reactFunctionalTs';
        const entryFileName = (0, _fileUtils.getEntryFileName)(internalFramework);
        const mainFileName = (0, _fileUtils.getMainFileName)(internalFramework);
        const boilerPlateFiles = await (0, _fileUtils.getBoilerPlateFiles)(isDev, internalFramework);
        let indexTsx = await (0, _chartvanillatoreactfunctionalts.vanillaToReactFunctionalTs)((0, _deepCloneObject.deepCloneObject)(typedBindings), []);
        // add website dark mode handling code to doc examples - this code is later striped out from the code viewer / plunker
        if (!ignoreDarkMode) {
            indexTsx = indexTsx + '\n' + (0, _getDarkModeSnippet.getDarkModeSnippet)();
        }
        indexTsx = await _prettier.default.format(indexTsx, {
            parser: 'typescript'
        });
        return {
            files: _extends._({}, otherScriptFiles, {
                [entryFileName]: indexTsx,
                'index.html': indexHtml
            }),
            boilerPlateFiles,
            // NOTE: `scriptFiles` not required, as system js handles import
            entryFileName,
            mainFileName
        };
    },
    angular: async ({ typedBindings, otherScriptFiles, isDev, ignoreDarkMode })=>{
        const internalFramework = 'angular';
        const entryFileName = (0, _fileUtils.getEntryFileName)(internalFramework);
        const mainFileName = (0, _fileUtils.getMainFileName)(internalFramework);
        const boilerPlateFiles = await (0, _fileUtils.getBoilerPlateFiles)(isDev, internalFramework);
        let appComponent = await (0, _chartvanillatoangular.vanillaToAngular)((0, _deepCloneObject.deepCloneObject)(typedBindings), []);
        // add website dark mode handling code to doc examples - this code is later striped out from the code viewer / plunker
        if (!ignoreDarkMode) {
            appComponent = appComponent + '\n' + (0, _getDarkModeSnippet.getDarkModeSnippet)();
        }
        appComponent = await _prettier.default.format(appComponent, {
            parser: 'typescript'
        });
        return {
            files: _extends._({}, otherScriptFiles, {
                // NOTE: No `index.html` as the contents are generated in the `app.component` file
                // NOTE: Duplicating entrypoint boilerplate file here, so examples
                // load from the same directory as these files, rather than
                // boilerplate files
                [entryFileName]: boilerPlateFiles[entryFileName],
                [_constants.ANGULAR_GENERATED_MAIN_FILE_NAME]: appComponent
            }),
            boilerPlateFiles,
            entryFileName,
            mainFileName
        };
    },
    vue: createVueFilesGenerator({
        sourceGenerator: _chartvanillatovue.vanillaToVue,
        internalFramework: 'vue'
    }),
    vue3: createVueFilesGenerator({
        sourceGenerator: _chartvanillatovue3.vanillaToVue3,
        internalFramework: 'vue3'
    })
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3V0aWxzL2ZyYW1ld29ya0ZpbGVzR2VuZXJhdG9yLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwcmV0dGllciBmcm9tICdwcmV0dGllcic7XG5cbmltcG9ydCB7IEFOR1VMQVJfR0VORVJBVEVEX01BSU5fRklMRV9OQU1FIH0gZnJvbSAnLi4vY29uc3RhbnRzJztcbmltcG9ydCB7IHZhbmlsbGFUb0FuZ3VsYXIgfSBmcm9tICcuLi90cmFuc2Zvcm1hdGlvbi1zY3JpcHRzL2NoYXJ0LXZhbmlsbGEtdG8tYW5ndWxhcic7XG5pbXBvcnQgeyB2YW5pbGxhVG9SZWFjdEZ1bmN0aW9uYWwgfSBmcm9tICcuLi90cmFuc2Zvcm1hdGlvbi1zY3JpcHRzL2NoYXJ0LXZhbmlsbGEtdG8tcmVhY3QtZnVuY3Rpb25hbCc7XG5pbXBvcnQgeyB2YW5pbGxhVG9SZWFjdEZ1bmN0aW9uYWxUcyB9IGZyb20gJy4uL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvY2hhcnQtdmFuaWxsYS10by1yZWFjdC1mdW5jdGlvbmFsLXRzJztcbmltcG9ydCB7IHZhbmlsbGFUb1Z1ZSB9IGZyb20gJy4uL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvY2hhcnQtdmFuaWxsYS10by12dWUnO1xuaW1wb3J0IHsgdmFuaWxsYVRvVnVlMyB9IGZyb20gJy4uL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvY2hhcnQtdmFuaWxsYS10by12dWUzJztcbmltcG9ydCB7IHJlYWRBc0pzRmlsZSB9IGZyb20gJy4uL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvcGFyc2VyLXV0aWxzJztcbmltcG9ydCB0eXBlIHsgSW50ZXJuYWxGcmFtZXdvcmsgfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgdHlwZSB7IEZpbGVDb250ZW50cyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IGRlZXBDbG9uZU9iamVjdCB9IGZyb20gJy4vZGVlcENsb25lT2JqZWN0JztcbmltcG9ydCB7IGdldEJvaWxlclBsYXRlRmlsZXMsIGdldEVudHJ5RmlsZU5hbWUsIGdldE1haW5GaWxlTmFtZSB9IGZyb20gJy4vZmlsZVV0aWxzJztcbmltcG9ydCB7IGdldERhcmtNb2RlU25pcHBldCB9IGZyb20gJy4vZ2V0RGFya01vZGVTbmlwcGV0JztcblxuaW50ZXJmYWNlIEZyYW1ld29ya0ZpbGVzIHtcbiAgICBmaWxlczogRmlsZUNvbnRlbnRzO1xuICAgIGJvaWxlclBsYXRlRmlsZXM/OiBGaWxlQ29udGVudHM7XG4gICAgaGFzUHJvdmlkZWRFeGFtcGxlcz86IGJvb2xlYW47XG4gICAgc2NyaXB0RmlsZXM/OiBzdHJpbmdbXTtcbiAgICAvKipcbiAgICAgKiBGaWxlbmFtZSB0byBleGVjdXRlIGNvZGVcbiAgICAgKi9cbiAgICBlbnRyeUZpbGVOYW1lOiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICogRmlsZW5hbWUgb2YgbWFpbiBjb2RlIHRoYXQgaXMgcnVuXG4gICAgICovXG4gICAgbWFpbkZpbGVOYW1lOiBzdHJpbmc7XG59XG5cbnR5cGUgQ29uZmlnR2VuZXJhdG9yID0gKHtcbiAgICBlbnRyeUZpbGUsXG4gICAgaW5kZXhIdG1sLFxuICAgIGlzRW50ZXJwcmlzZSxcbiAgICBiaW5kaW5ncyxcbiAgICB0eXBlZEJpbmRpbmdzLFxuICAgIG90aGVyU2NyaXB0RmlsZXMsXG4gICAgaWdub3JlRGFya01vZGUsXG4gICAgaXNEZXYsXG59OiB7XG4gICAgZW50cnlGaWxlOiBzdHJpbmc7XG4gICAgaW5kZXhIdG1sOiBzdHJpbmc7XG4gICAgaXNFbnRlcnByaXNlOiBib29sZWFuO1xuICAgIGJpbmRpbmdzOiBhbnk7XG4gICAgdHlwZWRCaW5kaW5nczogYW55O1xuICAgIG90aGVyU2NyaXB0RmlsZXM6IEZpbGVDb250ZW50cztcbiAgICBpZ25vcmVEYXJrTW9kZT86IGJvb2xlYW47XG4gICAgaXNEZXY6IGJvb2xlYW47XG59KSA9PiBQcm9taXNlPEZyYW1ld29ya0ZpbGVzPjtcblxuY29uc3QgY3JlYXRlVnVlRmlsZXNHZW5lcmF0b3IgPVxuICAgICh7XG4gICAgICAgIHNvdXJjZUdlbmVyYXRvcixcbiAgICAgICAgaW50ZXJuYWxGcmFtZXdvcmssXG4gICAgfToge1xuICAgICAgICBzb3VyY2VHZW5lcmF0b3I6IChiaW5kaW5nczogYW55LCBjb21wb25lbnRGaWxlbmFtZXM6IHN0cmluZ1tdKSA9PiBQcm9taXNlPHN0cmluZz47XG4gICAgICAgIGludGVybmFsRnJhbWV3b3JrOiBJbnRlcm5hbEZyYW1ld29yaztcbiAgICB9KTogQ29uZmlnR2VuZXJhdG9yID0+XG4gICAgYXN5bmMgKHsgYmluZGluZ3MsIGluZGV4SHRtbCwgb3RoZXJTY3JpcHRGaWxlcywgaXNEZXYsIGlnbm9yZURhcmtNb2RlIH0pID0+IHtcbiAgICAgICAgY29uc3QgYm9pbGVyUGxhdGVGaWxlcyA9IGF3YWl0IGdldEJvaWxlclBsYXRlRmlsZXMoaXNEZXYsIGludGVybmFsRnJhbWV3b3JrKTtcblxuICAgICAgICBsZXQgbWFpbkpzID0gYXdhaXQgc291cmNlR2VuZXJhdG9yKGRlZXBDbG9uZU9iamVjdChiaW5kaW5ncyksIFtdKTtcblxuICAgICAgICAvLyBhZGQgd2Vic2l0ZSBkYXJrIG1vZGUgaGFuZGxpbmcgY29kZSB0byBkb2MgZXhhbXBsZXMgLSB0aGlzIGNvZGUgaXMgbGF0ZXIgc3RyaXBlZCBvdXQgZnJvbSB0aGUgY29kZSB2aWV3ZXIgLyBwbHVua2VyXG4gICAgICAgIGlmICghaWdub3JlRGFya01vZGUpIHtcbiAgICAgICAgICAgIG1haW5KcyA9IG1haW5KcyArICdcXG4nICsgZ2V0RGFya01vZGVTbmlwcGV0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBtYWluSnMgPSBhd2FpdCBwcmV0dGllci5mb3JtYXQobWFpbkpzLCB7IHBhcnNlcjogJ2JhYmVsJyB9KTtcblxuICAgICAgICBjb25zdCBlbnRyeUZpbGVOYW1lID0gZ2V0RW50cnlGaWxlTmFtZShpbnRlcm5hbEZyYW1ld29yaykhO1xuICAgICAgICBjb25zdCBtYWluRmlsZU5hbWUgPSBnZXRNYWluRmlsZU5hbWUoaW50ZXJuYWxGcmFtZXdvcmspITtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmlsZXM6IHtcbiAgICAgICAgICAgICAgICAuLi5vdGhlclNjcmlwdEZpbGVzLFxuICAgICAgICAgICAgICAgIFtlbnRyeUZpbGVOYW1lXTogbWFpbkpzLFxuICAgICAgICAgICAgICAgICdpbmRleC5odG1sJzogaW5kZXhIdG1sLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvaWxlclBsYXRlRmlsZXMsXG4gICAgICAgICAgICAvLyBPdGhlciBmaWxlcywgbm90IGluY2x1ZGluZyBlbnRyeSBmaWxlXG4gICAgICAgICAgICBzY3JpcHRGaWxlczogT2JqZWN0LmtleXMob3RoZXJTY3JpcHRGaWxlcyksXG4gICAgICAgICAgICBlbnRyeUZpbGVOYW1lLFxuICAgICAgICAgICAgbWFpbkZpbGVOYW1lLFxuICAgICAgICB9O1xuICAgIH07XG5cbmV4cG9ydCBjb25zdCBmcmFtZXdvcmtGaWxlc0dlbmVyYXRvcjogUmVjb3JkPEludGVybmFsRnJhbWV3b3JrLCBDb25maWdHZW5lcmF0b3I+ID0ge1xuICAgIHZhbmlsbGE6IGFzeW5jICh7IGVudHJ5RmlsZSwgaW5kZXhIdG1sLCB0eXBlZEJpbmRpbmdzLCBvdGhlclNjcmlwdEZpbGVzLCBpZ25vcmVEYXJrTW9kZSB9KSA9PiB7XG4gICAgICAgIGNvbnN0IGludGVybmFsRnJhbWV3b3JrOiBJbnRlcm5hbEZyYW1ld29yayA9ICd2YW5pbGxhJztcbiAgICAgICAgY29uc3QgZW50cnlGaWxlTmFtZSA9IGdldEVudHJ5RmlsZU5hbWUoaW50ZXJuYWxGcmFtZXdvcmspITtcbiAgICAgICAgY29uc3QgbWFpbkZpbGVOYW1lID0gZ2V0TWFpbkZpbGVOYW1lKGludGVybmFsRnJhbWV3b3JrKSE7XG4gICAgICAgIGxldCBtYWluSnMgPSByZWFkQXNKc0ZpbGUoZW50cnlGaWxlKTtcblxuICAgICAgICAvLyBDaGFydCBjbGFzc2VzIHRoYXQgbmVlZCBzY29waW5nXG4gICAgICAgIGNvbnN0IGNoYXJ0SW1wb3J0cyA9IHR5cGVkQmluZGluZ3MuaW1wb3J0cy5maW5kKFxuICAgICAgICAgICAgKGk6IGFueSkgPT4gaS5tb2R1bGUuaW5jbHVkZXMoJ2FnLWNoYXJ0cy1jb21tdW5pdHknKSB8fCBpLm1vZHVsZS5pbmNsdWRlcygnYWctY2hhcnRzLWVudGVycHJpc2UnKVxuICAgICAgICApO1xuICAgICAgICBpZiAoY2hhcnRJbXBvcnRzKSB7XG4gICAgICAgICAgICBjaGFydEltcG9ydHMuaW1wb3J0cy5mb3JFYWNoKChpOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0b1JlcGxhY2UgPSBgKD88IVxcXFwuKSR7aX0oW1xcXFxzLy5dKWA7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVnID0gbmV3IFJlZ0V4cCh0b1JlcGxhY2UsICdnJyk7XG4gICAgICAgICAgICAgICAgbWFpbkpzID0gbWFpbkpzLnJlcGxhY2UocmVnLCBgYWdDaGFydHMuJHtpfSQxYCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFkZCB3ZWJzaXRlIGRhcmsgbW9kZSBoYW5kbGluZyBjb2RlIHRvIGRvYyBleGFtcGxlcyAtIHRoaXMgY29kZSBpcyBsYXRlciBzdHJpcGVkIG91dCBmcm9tIHRoZSBjb2RlIHZpZXdlciAvIHBsdW5rZXJcbiAgICAgICAgaWYgKCFpZ25vcmVEYXJrTW9kZSkge1xuICAgICAgICAgICAgbWFpbkpzID1cbiAgICAgICAgICAgICAgICBtYWluSnMgK1xuICAgICAgICAgICAgICAgIGBcXG5cbiAgICAgICAgICAgICR7Z2V0RGFya01vZGVTbmlwcGV0KHsgY2hhcnRBUEk6ICdhZ0NoYXJ0cy5BZ0NoYXJ0cycgfSl9YDtcbiAgICAgICAgfVxuXG4gICAgICAgIG1haW5KcyA9IGF3YWl0IHByZXR0aWVyLmZvcm1hdChtYWluSnMsIHsgcGFyc2VyOiAnYmFiZWwnIH0pO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWxlczoge1xuICAgICAgICAgICAgICAgIC4uLm90aGVyU2NyaXB0RmlsZXMsXG4gICAgICAgICAgICAgICAgW2VudHJ5RmlsZU5hbWVdOiBtYWluSnMsXG4gICAgICAgICAgICAgICAgJ2luZGV4Lmh0bWwnOiBpbmRleEh0bWwsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2NyaXB0RmlsZXM6IE9iamVjdC5rZXlzKG90aGVyU2NyaXB0RmlsZXMpLmNvbmNhdChlbnRyeUZpbGVOYW1lKSxcbiAgICAgICAgICAgIGVudHJ5RmlsZU5hbWUsXG4gICAgICAgICAgICBtYWluRmlsZU5hbWUsXG4gICAgICAgIH07XG4gICAgfSxcbiAgICB0eXBlc2NyaXB0OiBhc3luYyAoeyBlbnRyeUZpbGUsIGluZGV4SHRtbCwgb3RoZXJTY3JpcHRGaWxlcywgYmluZGluZ3MsIGlnbm9yZURhcmtNb2RlLCBpc0RldiB9KSA9PiB7XG4gICAgICAgIGNvbnN0IGludGVybmFsRnJhbWV3b3JrOiBJbnRlcm5hbEZyYW1ld29yayA9ICd0eXBlc2NyaXB0JztcbiAgICAgICAgY29uc3QgZW50cnlGaWxlTmFtZSA9IGdldEVudHJ5RmlsZU5hbWUoaW50ZXJuYWxGcmFtZXdvcmspITtcbiAgICAgICAgY29uc3QgbWFpbkZpbGVOYW1lID0gZ2V0TWFpbkZpbGVOYW1lKGludGVybmFsRnJhbWV3b3JrKSE7XG5cbiAgICAgICAgY29uc3QgeyBleHRlcm5hbEV2ZW50SGFuZGxlcnMgfSA9IGJpbmRpbmdzO1xuICAgICAgICBjb25zdCBib2lsZXJQbGF0ZUZpbGVzID0gYXdhaXQgZ2V0Qm9pbGVyUGxhdGVGaWxlcyhpc0RldiwgaW50ZXJuYWxGcmFtZXdvcmspO1xuXG4gICAgICAgIC8vIEF0dGFjaCBleHRlcm5hbCBldmVudCBoYW5kbGVyc1xuICAgICAgICBsZXQgZXh0ZXJuYWxFdmVudEhhbmRsZXJzQ29kZTtcbiAgICAgICAgaWYgKGV4dGVybmFsRXZlbnRIYW5kbGVycz8ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgZXh0ZXJuYWxCaW5kaW5ncyA9IGV4dGVybmFsRXZlbnRIYW5kbGVycy5tYXAoKGUpID0+IGAgICAoPGFueT53aW5kb3cpLiR7ZS5uYW1lfSA9ICR7ZS5uYW1lfTtgKTtcbiAgICAgICAgICAgIGV4dGVybmFsRXZlbnRIYW5kbGVyc0NvZGUgPSBbXG4gICAgICAgICAgICAgICAgJ1xcbicsXG4gICAgICAgICAgICAgICAgXCJpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcIixcbiAgICAgICAgICAgICAgICAnLy8gQXR0YWNoIGV4dGVybmFsIGV2ZW50IGhhbmRsZXJzIHRvIHdpbmRvdyBzbyB0aGV5IGNhbiBiZSBjYWxsZWQgZnJvbSBpbmRleC5odG1sJyxcbiAgICAgICAgICAgICAgICAuLi5leHRlcm5hbEJpbmRpbmdzLFxuICAgICAgICAgICAgICAgICd9JyxcbiAgICAgICAgICAgIF0uam9pbignXFxuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbWFpblRzID0gZXh0ZXJuYWxFdmVudEhhbmRsZXJzQ29kZSA/IGAke2VudHJ5RmlsZX0ke2V4dGVybmFsRXZlbnRIYW5kbGVyc0NvZGV9YCA6IGVudHJ5RmlsZTtcblxuICAgICAgICBjb25zdCBjaGFydEFQSSA9ICdBZ0NoYXJ0cyc7XG4gICAgICAgIGlmICghbWFpblRzLmluY2x1ZGVzKGBjaGFydCA9ICR7Y2hhcnRBUEl9YCkpIHtcbiAgICAgICAgICAgIG1haW5UcyA9IG1haW5Ucy5yZXBsYWNlKGAke2NoYXJ0QVBJfS5jcmVhdGUob3B0aW9ucyk7YCwgYGNvbnN0IGNoYXJ0ID0gJHtjaGFydEFQSX0uY3JlYXRlKG9wdGlvbnMpO2ApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYWRkIHdlYnNpdGUgZGFyayBtb2RlIGhhbmRsaW5nIGNvZGUgdG8gZG9jIGV4YW1wbGVzIC0gdGhpcyBjb2RlIGlzIGxhdGVyIHN0cmlwZWQgb3V0IGZyb20gdGhlIGNvZGUgdmlld2VyIC8gcGx1bmtlclxuICAgICAgICBpZiAoIWlnbm9yZURhcmtNb2RlKSB7XG4gICAgICAgICAgICBtYWluVHMgPSBtYWluVHMgKyAnXFxuJyArIGdldERhcmtNb2RlU25pcHBldCh7IGNoYXJ0QVBJIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgbWFpblRzID0gYXdhaXQgcHJldHRpZXIuZm9ybWF0KG1haW5UcywgeyBwYXJzZXI6ICd0eXBlc2NyaXB0JyB9KTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmlsZXM6IHtcbiAgICAgICAgICAgICAgICAuLi5vdGhlclNjcmlwdEZpbGVzLFxuICAgICAgICAgICAgICAgIFtlbnRyeUZpbGVOYW1lXTogbWFpblRzLFxuICAgICAgICAgICAgICAgICdpbmRleC5odG1sJzogaW5kZXhIdG1sLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvaWxlclBsYXRlRmlsZXMsXG4gICAgICAgICAgICAvLyBOT1RFOiBgc2NyaXB0RmlsZXNgIG5vdCByZXF1aXJlZCwgYXMgc3lzdGVtIGpzIGhhbmRsZXMgaW1wb3J0XG4gICAgICAgICAgICBlbnRyeUZpbGVOYW1lLFxuICAgICAgICAgICAgbWFpbkZpbGVOYW1lLFxuICAgICAgICB9O1xuICAgIH0sXG4gICAgcmVhY3RGdW5jdGlvbmFsOiBhc3luYyAoeyBiaW5kaW5ncywgaW5kZXhIdG1sLCBvdGhlclNjcmlwdEZpbGVzLCBpc0RldiwgaWdub3JlRGFya01vZGUgfSkgPT4ge1xuICAgICAgICBjb25zdCBpbnRlcm5hbEZyYW1ld29yayA9ICdyZWFjdEZ1bmN0aW9uYWwnO1xuICAgICAgICBjb25zdCBlbnRyeUZpbGVOYW1lID0gZ2V0RW50cnlGaWxlTmFtZShpbnRlcm5hbEZyYW1ld29yaykhO1xuICAgICAgICBjb25zdCBtYWluRmlsZU5hbWUgPSBnZXRNYWluRmlsZU5hbWUoaW50ZXJuYWxGcmFtZXdvcmspITtcbiAgICAgICAgY29uc3QgYm9pbGVyUGxhdGVGaWxlcyA9IGF3YWl0IGdldEJvaWxlclBsYXRlRmlsZXMoaXNEZXYsIGludGVybmFsRnJhbWV3b3JrKTtcblxuICAgICAgICBsZXQgaW5kZXhKc3ggPSBhd2FpdCB2YW5pbGxhVG9SZWFjdEZ1bmN0aW9uYWwoZGVlcENsb25lT2JqZWN0KGJpbmRpbmdzKSwgW10pO1xuXG4gICAgICAgIC8vIGFkZCB3ZWJzaXRlIGRhcmsgbW9kZSBoYW5kbGluZyBjb2RlIHRvIGRvYyBleGFtcGxlcyAtIHRoaXMgY29kZSBpcyBsYXRlciBzdHJpcGVkIG91dCBmcm9tIHRoZSBjb2RlIHZpZXdlciAvIHBsdW5rZXJcbiAgICAgICAgaWYgKCFpZ25vcmVEYXJrTW9kZSkge1xuICAgICAgICAgICAgaW5kZXhKc3ggPSBpbmRleEpzeCArICdcXG4nICsgZ2V0RGFya01vZGVTbmlwcGV0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpbmRleEpzeCA9IGF3YWl0IHByZXR0aWVyLmZvcm1hdChpbmRleEpzeCwgeyBwYXJzZXI6ICdiYWJlbCcgfSk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpbGVzOiB7XG4gICAgICAgICAgICAgICAgLi4ub3RoZXJTY3JpcHRGaWxlcyxcbiAgICAgICAgICAgICAgICBbZW50cnlGaWxlTmFtZV06IGluZGV4SnN4LFxuICAgICAgICAgICAgICAgICdpbmRleC5odG1sJzogaW5kZXhIdG1sLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvaWxlclBsYXRlRmlsZXMsXG4gICAgICAgICAgICAvLyBPdGhlciBmaWxlcywgbm90IGluY2x1ZGluZyBlbnRyeSBmaWxlXG4gICAgICAgICAgICBzY3JpcHRGaWxlczogT2JqZWN0LmtleXMob3RoZXJTY3JpcHRGaWxlcyksXG4gICAgICAgICAgICBlbnRyeUZpbGVOYW1lLFxuICAgICAgICAgICAgbWFpbkZpbGVOYW1lLFxuICAgICAgICB9O1xuICAgIH0sXG4gICAgcmVhY3RGdW5jdGlvbmFsVHM6IGFzeW5jICh7IHR5cGVkQmluZGluZ3MsIGluZGV4SHRtbCwgb3RoZXJTY3JpcHRGaWxlcywgaWdub3JlRGFya01vZGUsIGlzRGV2IH0pID0+IHtcbiAgICAgICAgY29uc3QgaW50ZXJuYWxGcmFtZXdvcms6IEludGVybmFsRnJhbWV3b3JrID0gJ3JlYWN0RnVuY3Rpb25hbFRzJztcbiAgICAgICAgY29uc3QgZW50cnlGaWxlTmFtZSA9IGdldEVudHJ5RmlsZU5hbWUoaW50ZXJuYWxGcmFtZXdvcmspITtcbiAgICAgICAgY29uc3QgbWFpbkZpbGVOYW1lID0gZ2V0TWFpbkZpbGVOYW1lKGludGVybmFsRnJhbWV3b3JrKSE7XG4gICAgICAgIGNvbnN0IGJvaWxlclBsYXRlRmlsZXMgPSBhd2FpdCBnZXRCb2lsZXJQbGF0ZUZpbGVzKGlzRGV2LCBpbnRlcm5hbEZyYW1ld29yayk7XG5cbiAgICAgICAgbGV0IGluZGV4VHN4ID0gYXdhaXQgdmFuaWxsYVRvUmVhY3RGdW5jdGlvbmFsVHMoZGVlcENsb25lT2JqZWN0KHR5cGVkQmluZGluZ3MpLCBbXSk7XG5cbiAgICAgICAgLy8gYWRkIHdlYnNpdGUgZGFyayBtb2RlIGhhbmRsaW5nIGNvZGUgdG8gZG9jIGV4YW1wbGVzIC0gdGhpcyBjb2RlIGlzIGxhdGVyIHN0cmlwZWQgb3V0IGZyb20gdGhlIGNvZGUgdmlld2VyIC8gcGx1bmtlclxuICAgICAgICBpZiAoIWlnbm9yZURhcmtNb2RlKSB7XG4gICAgICAgICAgICBpbmRleFRzeCA9IGluZGV4VHN4ICsgJ1xcbicgKyBnZXREYXJrTW9kZVNuaXBwZXQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGluZGV4VHN4ID0gYXdhaXQgcHJldHRpZXIuZm9ybWF0KGluZGV4VHN4LCB7IHBhcnNlcjogJ3R5cGVzY3JpcHQnIH0pO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWxlczoge1xuICAgICAgICAgICAgICAgIC4uLm90aGVyU2NyaXB0RmlsZXMsXG4gICAgICAgICAgICAgICAgW2VudHJ5RmlsZU5hbWVdOiBpbmRleFRzeCxcbiAgICAgICAgICAgICAgICAnaW5kZXguaHRtbCc6IGluZGV4SHRtbCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib2lsZXJQbGF0ZUZpbGVzLFxuICAgICAgICAgICAgLy8gTk9URTogYHNjcmlwdEZpbGVzYCBub3QgcmVxdWlyZWQsIGFzIHN5c3RlbSBqcyBoYW5kbGVzIGltcG9ydFxuICAgICAgICAgICAgZW50cnlGaWxlTmFtZSxcbiAgICAgICAgICAgIG1haW5GaWxlTmFtZSxcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGFuZ3VsYXI6IGFzeW5jICh7IHR5cGVkQmluZGluZ3MsIG90aGVyU2NyaXB0RmlsZXMsIGlzRGV2LCBpZ25vcmVEYXJrTW9kZSB9KSA9PiB7XG4gICAgICAgIGNvbnN0IGludGVybmFsRnJhbWV3b3JrOiBJbnRlcm5hbEZyYW1ld29yayA9ICdhbmd1bGFyJztcbiAgICAgICAgY29uc3QgZW50cnlGaWxlTmFtZSA9IGdldEVudHJ5RmlsZU5hbWUoaW50ZXJuYWxGcmFtZXdvcmspITtcbiAgICAgICAgY29uc3QgbWFpbkZpbGVOYW1lID0gZ2V0TWFpbkZpbGVOYW1lKGludGVybmFsRnJhbWV3b3JrKSE7XG4gICAgICAgIGNvbnN0IGJvaWxlclBsYXRlRmlsZXMgPSBhd2FpdCBnZXRCb2lsZXJQbGF0ZUZpbGVzKGlzRGV2LCBpbnRlcm5hbEZyYW1ld29yayk7XG5cbiAgICAgICAgbGV0IGFwcENvbXBvbmVudCA9IGF3YWl0IHZhbmlsbGFUb0FuZ3VsYXIoZGVlcENsb25lT2JqZWN0KHR5cGVkQmluZGluZ3MpLCBbXSk7XG5cbiAgICAgICAgLy8gYWRkIHdlYnNpdGUgZGFyayBtb2RlIGhhbmRsaW5nIGNvZGUgdG8gZG9jIGV4YW1wbGVzIC0gdGhpcyBjb2RlIGlzIGxhdGVyIHN0cmlwZWQgb3V0IGZyb20gdGhlIGNvZGUgdmlld2VyIC8gcGx1bmtlclxuICAgICAgICBpZiAoIWlnbm9yZURhcmtNb2RlKSB7XG4gICAgICAgICAgICBhcHBDb21wb25lbnQgPSBhcHBDb21wb25lbnQgKyAnXFxuJyArIGdldERhcmtNb2RlU25pcHBldCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXBwQ29tcG9uZW50ID0gYXdhaXQgcHJldHRpZXIuZm9ybWF0KGFwcENvbXBvbmVudCwgeyBwYXJzZXI6ICd0eXBlc2NyaXB0JyB9KTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmlsZXM6IHtcbiAgICAgICAgICAgICAgICAuLi5vdGhlclNjcmlwdEZpbGVzLFxuICAgICAgICAgICAgICAgIC8vIE5PVEU6IE5vIGBpbmRleC5odG1sYCBhcyB0aGUgY29udGVudHMgYXJlIGdlbmVyYXRlZCBpbiB0aGUgYGFwcC5jb21wb25lbnRgIGZpbGVcbiAgICAgICAgICAgICAgICAvLyBOT1RFOiBEdXBsaWNhdGluZyBlbnRyeXBvaW50IGJvaWxlcnBsYXRlIGZpbGUgaGVyZSwgc28gZXhhbXBsZXNcbiAgICAgICAgICAgICAgICAvLyBsb2FkIGZyb20gdGhlIHNhbWUgZGlyZWN0b3J5IGFzIHRoZXNlIGZpbGVzLCByYXRoZXIgdGhhblxuICAgICAgICAgICAgICAgIC8vIGJvaWxlcnBsYXRlIGZpbGVzXG4gICAgICAgICAgICAgICAgW2VudHJ5RmlsZU5hbWVdOiBib2lsZXJQbGF0ZUZpbGVzW2VudHJ5RmlsZU5hbWVdLFxuICAgICAgICAgICAgICAgIFtBTkdVTEFSX0dFTkVSQVRFRF9NQUlOX0ZJTEVfTkFNRV06IGFwcENvbXBvbmVudCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib2lsZXJQbGF0ZUZpbGVzLFxuICAgICAgICAgICAgZW50cnlGaWxlTmFtZSxcbiAgICAgICAgICAgIG1haW5GaWxlTmFtZSxcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIHZ1ZTogY3JlYXRlVnVlRmlsZXNHZW5lcmF0b3Ioe1xuICAgICAgICBzb3VyY2VHZW5lcmF0b3I6IHZhbmlsbGFUb1Z1ZSxcbiAgICAgICAgaW50ZXJuYWxGcmFtZXdvcms6ICd2dWUnLFxuICAgIH0pLFxuICAgIHZ1ZTM6IGNyZWF0ZVZ1ZUZpbGVzR2VuZXJhdG9yKHtcbiAgICAgICAgc291cmNlR2VuZXJhdG9yOiB2YW5pbGxhVG9WdWUzLFxuICAgICAgICBpbnRlcm5hbEZyYW1ld29yazogJ3Z1ZTMnLFxuICAgIH0pLFxufTtcbiJdLCJuYW1lcyI6WyJmcmFtZXdvcmtGaWxlc0dlbmVyYXRvciIsImNyZWF0ZVZ1ZUZpbGVzR2VuZXJhdG9yIiwic291cmNlR2VuZXJhdG9yIiwiaW50ZXJuYWxGcmFtZXdvcmsiLCJiaW5kaW5ncyIsImluZGV4SHRtbCIsIm90aGVyU2NyaXB0RmlsZXMiLCJpc0RldiIsImlnbm9yZURhcmtNb2RlIiwiYm9pbGVyUGxhdGVGaWxlcyIsImdldEJvaWxlclBsYXRlRmlsZXMiLCJtYWluSnMiLCJkZWVwQ2xvbmVPYmplY3QiLCJnZXREYXJrTW9kZVNuaXBwZXQiLCJwcmV0dGllciIsImZvcm1hdCIsInBhcnNlciIsImVudHJ5RmlsZU5hbWUiLCJnZXRFbnRyeUZpbGVOYW1lIiwibWFpbkZpbGVOYW1lIiwiZ2V0TWFpbkZpbGVOYW1lIiwiZmlsZXMiLCJzY3JpcHRGaWxlcyIsIk9iamVjdCIsImtleXMiLCJ2YW5pbGxhIiwiZW50cnlGaWxlIiwidHlwZWRCaW5kaW5ncyIsInJlYWRBc0pzRmlsZSIsImNoYXJ0SW1wb3J0cyIsImltcG9ydHMiLCJmaW5kIiwiaSIsIm1vZHVsZSIsImluY2x1ZGVzIiwiZm9yRWFjaCIsInRvUmVwbGFjZSIsInJlZyIsIlJlZ0V4cCIsInJlcGxhY2UiLCJjaGFydEFQSSIsImNvbmNhdCIsInR5cGVzY3JpcHQiLCJleHRlcm5hbEV2ZW50SGFuZGxlcnMiLCJleHRlcm5hbEV2ZW50SGFuZGxlcnNDb2RlIiwibGVuZ3RoIiwiZXh0ZXJuYWxCaW5kaW5ncyIsIm1hcCIsImUiLCJuYW1lIiwiam9pbiIsIm1haW5UcyIsInJlYWN0RnVuY3Rpb25hbCIsImluZGV4SnN4IiwidmFuaWxsYVRvUmVhY3RGdW5jdGlvbmFsIiwicmVhY3RGdW5jdGlvbmFsVHMiLCJpbmRleFRzeCIsInZhbmlsbGFUb1JlYWN0RnVuY3Rpb25hbFRzIiwiYW5ndWxhciIsImFwcENvbXBvbmVudCIsInZhbmlsbGFUb0FuZ3VsYXIiLCJBTkdVTEFSX0dFTkVSQVRFRF9NQUlOX0ZJTEVfTkFNRSIsInZ1ZSIsInZhbmlsbGFUb1Z1ZSIsInZ1ZTMiLCJ2YW5pbGxhVG9WdWUzIl0sIm1hcHBpbmdzIjoiOzs7OytCQXVGYUE7OztlQUFBQTs7Ozs7bUVBdkZROzJCQUU0Qjt1Q0FDaEI7K0NBQ1E7aURBQ0U7bUNBQ2Q7b0NBQ0M7NkJBQ0Q7aUNBR0c7MkJBQ3VDO29DQUNwQztBQXFDbkMsTUFBTUMsMEJBQ0YsQ0FBQyxFQUNHQyxlQUFlLEVBQ2ZDLGlCQUFpQixFQUlwQixHQUNELE9BQU8sRUFBRUMsUUFBUSxFQUFFQyxTQUFTLEVBQUVDLGdCQUFnQixFQUFFQyxLQUFLLEVBQUVDLGNBQWMsRUFBRTtRQUNuRSxNQUFNQyxtQkFBbUIsTUFBTUMsSUFBQUEsOEJBQW1CLEVBQUNILE9BQU9KO1FBRTFELElBQUlRLFNBQVMsTUFBTVQsZ0JBQWdCVSxJQUFBQSxnQ0FBZSxFQUFDUixXQUFXLEVBQUU7UUFFaEUsc0hBQXNIO1FBQ3RILElBQUksQ0FBQ0ksZ0JBQWdCO1lBQ2pCRyxTQUFTQSxTQUFTLE9BQU9FLElBQUFBLHNDQUFrQjtRQUMvQztRQUVBRixTQUFTLE1BQU1HLGlCQUFRLENBQUNDLE1BQU0sQ0FBQ0osUUFBUTtZQUFFSyxRQUFRO1FBQVE7UUFFekQsTUFBTUMsZ0JBQWdCQyxJQUFBQSwyQkFBZ0IsRUFBQ2Y7UUFDdkMsTUFBTWdCLGVBQWVDLElBQUFBLDBCQUFlLEVBQUNqQjtRQUVyQyxPQUFPO1lBQ0hrQixPQUFPLGVBQ0FmO2dCQUNILENBQUNXLGNBQWMsRUFBRU47Z0JBQ2pCLGNBQWNOOztZQUVsQkk7WUFDQSx3Q0FBd0M7WUFDeENhLGFBQWFDLE9BQU9DLElBQUksQ0FBQ2xCO1lBQ3pCVztZQUNBRTtRQUNKO0lBQ0o7QUFFRyxNQUFN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