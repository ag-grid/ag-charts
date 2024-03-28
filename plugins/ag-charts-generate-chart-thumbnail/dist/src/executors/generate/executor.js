/* eslint-disable no-console */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    default: function() {
        return _default;
    },
    generateFiles: function() {
        return generateFiles;
    }
});
const _interop_require_default = require("@swc/helpers/_/_interop_require_default");
const _path = /*#__PURE__*/ _interop_require_default._(require("path"));
const _executorsutils = require("../../executors-utils");
const _thumbnailGenerator = require("./generator/thumbnailGenerator");
const THEMES = {
    'ag-default': true,
    'ag-default-dark': true,
    'ag-material': true,
    'ag-material-dark': true,
    'ag-polychroma': true,
    'ag-polychroma-dark': true,
    'ag-sheets': true,
    'ag-sheets-dark': true,
    'ag-vivid': true,
    'ag-vivid-dark': true
};
async function _default(options, ctx) {
    try {
        await generateFiles(options, ctx);
        return {
            success: true,
            terminalOutput: `Generating thumbnails for [${options.generatedExamplePath}]`
        };
    } catch (e) {
        console.error(e);
        return {
            success: false
        };
    }
}
async function generateFiles(options, ctx) {
    const { generatedExamplePath, outputPath } = options;
    const name = `${ctx.projectName}:${ctx.targetName}:${ctx.configurationName ?? ''}`;
    const jsonPath = _path.default.join(generatedExamplePath, 'plain', 'vanilla', 'contents.json');
    const example = await (0, _executorsutils.readJSONFile)(jsonPath);
    const production = [
        'production',
        'staging'
    ].includes(process.env.NX_TASK_TARGET_CONFIGURATION);
    const dpiOutputs = production ? [
        1,
        2
    ] : [
        1
    ];
    if (example == null) {
        throw new Error(`Unable to read generated example: [${jsonPath}]`);
    }
    await (0, _executorsutils.ensureDirectory)(outputPath);
    const timesCalled = await (0, _executorsutils.consolePrefix)(`[${ctx.projectName}] `, async ()=>{
        for (const theme of Object.keys(THEMES)){
            for (const dpi of dpiOutputs){
                try {
                    await (0, _thumbnailGenerator.generateExample)({
                        example,
                        theme,
                        outputPath,
                        dpi
                    });
                } catch (e) {
                    throw new Error(`Unable to render example [${name}] with theme [${theme}]: ${e}`);
                }
            }
        }
    });
    if (timesCalled.error > 0) {
        throw new Error(`Error when rendering example [${name}] - see console output.`);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZXhlY3V0b3IudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuaW1wb3J0IHR5cGUgeyBFeGVjdXRvckNvbnRleHQgfSBmcm9tICdAbngvZGV2a2l0JztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQgdHlwZSB7IEFnQ2hhcnRUaGVtZU5hbWUgfSBmcm9tICdhZy1jaGFydHMtY29tbXVuaXR5JztcblxuaW1wb3J0IHsgY29uc29sZVByZWZpeCwgZW5zdXJlRGlyZWN0b3J5LCByZWFkSlNPTkZpbGUgfSBmcm9tICcuLi8uLi9leGVjdXRvcnMtdXRpbHMnO1xuaW1wb3J0IHsgZ2VuZXJhdGVFeGFtcGxlIH0gZnJvbSAnLi9nZW5lcmF0b3IvdGh1bWJuYWlsR2VuZXJhdG9yJztcblxuZXhwb3J0IHR5cGUgRXhlY3V0b3JPcHRpb25zID0ge1xuICAgIG91dHB1dFBhdGg6IHN0cmluZztcbiAgICBnZW5lcmF0ZWRFeGFtcGxlUGF0aDogc3RyaW5nO1xufTtcblxuY29uc3QgVEhFTUVTOiBSZWNvcmQ8QWdDaGFydFRoZW1lTmFtZSwgYm9vbGVhbj4gPSB7XG4gICAgJ2FnLWRlZmF1bHQnOiB0cnVlLFxuICAgICdhZy1kZWZhdWx0LWRhcmsnOiB0cnVlLFxuICAgICdhZy1tYXRlcmlhbCc6IHRydWUsXG4gICAgJ2FnLW1hdGVyaWFsLWRhcmsnOiB0cnVlLFxuICAgICdhZy1wb2x5Y2hyb21hJzogdHJ1ZSxcbiAgICAnYWctcG9seWNocm9tYS1kYXJrJzogdHJ1ZSxcbiAgICAnYWctc2hlZXRzJzogdHJ1ZSxcbiAgICAnYWctc2hlZXRzLWRhcmsnOiB0cnVlLFxuICAgICdhZy12aXZpZCc6IHRydWUsXG4gICAgJ2FnLXZpdmlkLWRhcmsnOiB0cnVlLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gKG9wdGlvbnM6IEV4ZWN1dG9yT3B0aW9ucywgY3R4OiBFeGVjdXRvckNvbnRleHQpIHtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBnZW5lcmF0ZUZpbGVzKG9wdGlvbnMsIGN0eCk7XG5cbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgdGVybWluYWxPdXRwdXQ6IGBHZW5lcmF0aW5nIHRodW1ibmFpbHMgZm9yIFske29wdGlvbnMuZ2VuZXJhdGVkRXhhbXBsZVBhdGh9XWAgfTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlIH07XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVGaWxlcyhvcHRpb25zOiBFeGVjdXRvck9wdGlvbnMsIGN0eDogRXhlY3V0b3JDb250ZXh0KSB7XG4gICAgY29uc3QgeyBnZW5lcmF0ZWRFeGFtcGxlUGF0aCwgb3V0cHV0UGF0aCB9ID0gb3B0aW9ucztcbiAgICBjb25zdCBuYW1lID0gYCR7Y3R4LnByb2plY3ROYW1lfToke2N0eC50YXJnZXROYW1lfToke2N0eC5jb25maWd1cmF0aW9uTmFtZSA/PyAnJ31gO1xuICAgIGNvbnN0IGpzb25QYXRoID0gcGF0aC5qb2luKGdlbmVyYXRlZEV4YW1wbGVQYXRoLCAncGxhaW4nLCAndmFuaWxsYScsICdjb250ZW50cy5qc29uJyk7XG4gICAgY29uc3QgZXhhbXBsZSA9IGF3YWl0IHJlYWRKU09ORmlsZShqc29uUGF0aCk7XG4gICAgY29uc3QgcHJvZHVjdGlvbiA9IFsncHJvZHVjdGlvbicsICdzdGFnaW5nJ10uaW5jbHVkZXMocHJvY2Vzcy5lbnYuTlhfVEFTS19UQVJHRVRfQ09ORklHVVJBVElPTik7XG4gICAgY29uc3QgZHBpT3V0cHV0cyA9IHByb2R1Y3Rpb24gPyBbMSwgMl0gOiBbMV07XG5cbiAgICBpZiAoZXhhbXBsZSA9PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIHJlYWQgZ2VuZXJhdGVkIGV4YW1wbGU6IFske2pzb25QYXRofV1gKTtcbiAgICB9XG5cbiAgICBhd2FpdCBlbnN1cmVEaXJlY3Rvcnkob3V0cHV0UGF0aCk7XG5cbiAgICBjb25zdCB0aW1lc0NhbGxlZCA9IGF3YWl0IGNvbnNvbGVQcmVmaXgoYFske2N0eC5wcm9qZWN0TmFtZX1dIGAsIGFzeW5jICgpID0+IHtcbiAgICAgICAgZm9yIChjb25zdCB0aGVtZSBvZiBPYmplY3Qua2V5cyhUSEVNRVMpIGFzIEFnQ2hhcnRUaGVtZU5hbWVbXSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBkcGkgb2YgZHBpT3V0cHV0cykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGdlbmVyYXRlRXhhbXBsZSh7IGV4YW1wbGUsIHRoZW1lLCBvdXRwdXRQYXRoLCBkcGkgfSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byByZW5kZXIgZXhhbXBsZSBbJHtuYW1lfV0gd2l0aCB0aGVtZSBbJHt0aGVtZX1dOiAke2V9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAodGltZXNDYWxsZWQuZXJyb3IgPiAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3Igd2hlbiByZW5kZXJpbmcgZXhhbXBsZSBbJHtuYW1lfV0gLSBzZWUgY29uc29sZSBvdXRwdXQuYCk7XG4gICAgfVxufVxuIl0sIm5hbWVzIjpbImdlbmVyYXRlRmlsZXMiLCJUSEVNRVMiLCJvcHRpb25zIiwiY3R4Iiwic3VjY2VzcyIsInRlcm1pbmFsT3V0cHV0IiwiZ2VuZXJhdGVkRXhhbXBsZVBhdGgiLCJlIiwiY29uc29sZSIsImVycm9yIiwib3V0cHV0UGF0aCIsIm5hbWUiLCJwcm9qZWN0TmFtZSIsInRhcmdldE5hbWUiLCJjb25maWd1cmF0aW9uTmFtZSIsImpzb25QYXRoIiwicGF0aCIsImpvaW4iLCJleGFtcGxlIiwicmVhZEpTT05GaWxlIiwicHJvZHVjdGlvbiIsImluY2x1ZGVzIiwicHJvY2VzcyIsImVudiIsIk5YX1RBU0tfVEFSR0VUX0NPTkZJR1VSQVRJT04iLCJkcGlPdXRwdXRzIiwiRXJyb3IiLCJlbnN1cmVEaXJlY3RvcnkiLCJ0aW1lc0NhbGxlZCIsImNvbnNvbGVQcmVmaXgiLCJ0aGVtZSIsIk9iamVjdCIsImtleXMiLCJkcGkiLCJnZW5lcmF0ZUV4YW1wbGUiXSwibWFwcGluZ3MiOiJBQUFBLDZCQUE2Qjs7Ozs7Ozs7Ozs7SUEyQjdCLE9BU0M7ZUFURDs7SUFXc0JBLGFBQWE7ZUFBYkE7Ozs7K0RBcENMO2dDQUk0QztvQ0FDN0I7QUFPaEMsTUFBTUMsU0FBNEM7SUFDOUMsY0FBYztJQUNkLG1CQUFtQjtJQUNuQixlQUFlO0lBQ2Ysb0JBQW9CO0lBQ3BCLGlCQUFpQjtJQUNqQixzQkFBc0I7SUFDdEIsYUFBYTtJQUNiLGtCQUFrQjtJQUNsQixZQUFZO0lBQ1osaUJBQWlCO0FBQ3JCO0FBRWUsZUFBZixTQUErQkMsT0FBd0IsRUFBRUMsR0FBb0I7SUFDekUsSUFBSTtRQUNBLE1BQU1ILGNBQWNFLFNBQVNDO1FBRTdCLE9BQU87WUFBRUMsU0FBUztZQUFNQyxnQkFBZ0IsQ0FBQywyQkFBMkIsRUFBRUgsUUFBUUksb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQUM7SUFDMUcsRUFBRSxPQUFPQyxHQUFHO1FBQ1JDLFFBQVFDLEtBQUssQ0FBQ0Y7UUFDZCxPQUFPO1lBQUVILFNBQVM7UUFBTTtJQUM1QjtBQUNKO0FBRU8sZUFBZUosY0FBY0UsT0FBd0IsRUFBRUMsR0FBb0I7SUFDOUUsTUFBTSxFQUFFRyxvQkFBb0IsRUFBRUksVUFBVSxFQUFFLEdBQUdSO0lBQzdDLE1BQU1TLE9BQU8sQ0FBQyxFQUFFUixJQUFJUyxXQUFXLENBQUMsQ0FBQyxFQUFFVCxJQUFJVSxVQUFVLENBQUMsQ0FBQyxFQUFFVixJQUFJVyxpQkFBaUIsSUFBSSxHQUFHLENBQUM7SUFDbEYsTUFBTUMsV0FBV0MsYUFBSSxDQUFDQyxJQUFJLENBQUNYLHNCQUFzQixTQUFTLFdBQVc7SUFDckUsTUFBTVksVUFBVSxNQUFNQyxJQUFBQSw0QkFBWSxFQUFDSjtJQUNuQyxNQUFNSyxhQUFhO1FBQUM7UUFBYztLQUFVLENBQUNDLFFBQVEsQ0FBQ0MsUUFBUUMsR0FBRyxDQUFDQyw0QkFBNEI7SUFDOUYsTUFBTUMsYUFBYUwsYUFBYTtRQUFDO1FBQUc7S0FBRSxHQUFHO1FBQUM7S0FBRTtJQUU1QyxJQUFJRixXQUFXLE1BQU07UUFDakIsTUFBTSxJQUFJUSxNQUFNLENBQUMsbUNBQW1DLEVBQUVYLFNBQVMsQ0FBQyxDQUFDO0lBQ3JFO0lBRUEsTUFBTVksSUFBQUEsK0JBQWUsRUFBQ2pCO0lBRXRCLE1BQU1rQixjQUFjLE1BQU1DLElBQUFBLDZCQUFhLEVBQUMsQ0FBQyxDQUFDLEVBQUUxQixJQUFJUyxXQUFXLENBQUMsRUFBRSxDQUFDLEVBQUU7UUFDN0QsS0FBSyxNQUFNa0IsU0FBU0MsT0FBT0MsSUFBSSxDQUFDL0IsUUFBK0I7WUFDM0QsS0FBSyxNQUFNZ0MsT0FBT1IsV0FBWTtnQkFDMUIsSUFBSTtvQkFDQSxNQUFNUyxJQUFBQSxtQ0FBZSxFQUFDO3dCQUFFaEI7d0JBQVNZO3dCQUFPcEI7d0JBQVl1QjtvQkFBSTtnQkFDNUQsRUFBRSxPQUFPMUIsR0FBRztvQkFDUixNQUFNLElBQUltQixNQUFNLENBQUMsMEJBQTBCLEVBQUVmLEtBQUssY0FBYyxFQUFFbUIsTUFBTSxHQUFHLEVBQUV2QixFQUFFLENBQUM7Z0JBQ3BGO1lBQ0o7UUFDSjtJQUNKO0lBRUEsSUFBSXFCLFlBQVluQixLQUFLLEdBQUcsR0FBRztRQUN2QixNQUFNLElBQUlpQixNQUFNLENBQUMsOEJBQThCLEVBQUVmLEtBQUssdUJBQXVCLENBQUM7SUFDbEY7QUFDSiJ9