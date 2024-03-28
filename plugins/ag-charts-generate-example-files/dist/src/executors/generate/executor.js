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
const _examplesGenerator = require("./generator/examplesGenerator");
const _types = require("./generator/types");
async function _default(options) {
    try {
        await generateFiles(options);
        return {
            success: true,
            terminalOutput: `Generating example [${options.examplePath}]`
        };
    } catch (e) {
        console.error(e);
        return {
            success: false
        };
    }
}
async function generateFiles(options) {
    for (const ignoreDarkMode of [
        false,
        true
    ]){
        const darkModePath = ignoreDarkMode ? 'plain' : 'dark-mode';
        for (const internalFramework of _types.FRAMEWORKS){
            const result = await (0, _examplesGenerator.getGeneratedContents)({
                folderPath: options.examplePath,
                internalFramework,
                ignoreDarkMode,
                isDev: options.mode === 'dev'
            });
            const outputPath = _path.default.join(options.outputPath, darkModePath, internalFramework, 'contents.json');
            await (0, _executorsutils.writeFile)(outputPath, JSON.stringify(result));
            for(const name in result.generatedFiles){
                if (typeof result.generatedFiles[name] !== 'string') {
                    throw new Error(`${outputPath}: non-string file content`);
                }
            }
        }
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZXhlY3V0b3IudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmltcG9ydCB7IHdyaXRlRmlsZSB9IGZyb20gJy4uLy4uL2V4ZWN1dG9ycy11dGlscyc7XG5pbXBvcnQgeyBnZXRHZW5lcmF0ZWRDb250ZW50cyB9IGZyb20gJy4vZ2VuZXJhdG9yL2V4YW1wbGVzR2VuZXJhdG9yJztcbmltcG9ydCB7IEZSQU1FV09SS1MgfSBmcm9tICcuL2dlbmVyYXRvci90eXBlcyc7XG5cbmV4cG9ydCB0eXBlIEV4ZWN1dG9yT3B0aW9ucyA9IHtcbiAgICBtb2RlOiAnZGV2JyB8ICdwcm9kJztcbiAgICBvdXRwdXRQYXRoOiBzdHJpbmc7XG4gICAgZXhhbXBsZVBhdGg6IHN0cmluZztcbiAgICBpbnB1dHM6IHN0cmluZ1tdO1xuICAgIG91dHB1dDogc3RyaW5nO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gKG9wdGlvbnM6IEV4ZWN1dG9yT3B0aW9ucykge1xuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGdlbmVyYXRlRmlsZXMob3B0aW9ucyk7XG5cbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgdGVybWluYWxPdXRwdXQ6IGBHZW5lcmF0aW5nIGV4YW1wbGUgWyR7b3B0aW9ucy5leGFtcGxlUGF0aH1dYCB9O1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UgfTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUZpbGVzKG9wdGlvbnM6IEV4ZWN1dG9yT3B0aW9ucykge1xuICAgIGZvciAoY29uc3QgaWdub3JlRGFya01vZGUgb2YgW2ZhbHNlLCB0cnVlXSkge1xuICAgICAgICBjb25zdCBkYXJrTW9kZVBhdGggPSBpZ25vcmVEYXJrTW9kZSA/ICdwbGFpbicgOiAnZGFyay1tb2RlJztcbiAgICAgICAgZm9yIChjb25zdCBpbnRlcm5hbEZyYW1ld29yayBvZiBGUkFNRVdPUktTKSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBnZXRHZW5lcmF0ZWRDb250ZW50cyh7XG4gICAgICAgICAgICAgICAgZm9sZGVyUGF0aDogb3B0aW9ucy5leGFtcGxlUGF0aCxcbiAgICAgICAgICAgICAgICBpbnRlcm5hbEZyYW1ld29yayxcbiAgICAgICAgICAgICAgICBpZ25vcmVEYXJrTW9kZSxcbiAgICAgICAgICAgICAgICBpc0Rldjogb3B0aW9ucy5tb2RlID09PSAnZGV2JyxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBvdXRwdXRQYXRoID0gcGF0aC5qb2luKG9wdGlvbnMub3V0cHV0UGF0aCwgZGFya01vZGVQYXRoLCBpbnRlcm5hbEZyYW1ld29yaywgJ2NvbnRlbnRzLmpzb24nKTtcbiAgICAgICAgICAgIGF3YWl0IHdyaXRlRmlsZShvdXRwdXRQYXRoLCBKU09OLnN0cmluZ2lmeShyZXN1bHQpKTtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBuYW1lIGluIHJlc3VsdC5nZW5lcmF0ZWRGaWxlcykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0LmdlbmVyYXRlZEZpbGVzW25hbWVdICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7b3V0cHV0UGF0aH06IG5vbi1zdHJpbmcgZmlsZSBjb250ZW50YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIl0sIm5hbWVzIjpbImdlbmVyYXRlRmlsZXMiLCJvcHRpb25zIiwic3VjY2VzcyIsInRlcm1pbmFsT3V0cHV0IiwiZXhhbXBsZVBhdGgiLCJlIiwiY29uc29sZSIsImVycm9yIiwiaWdub3JlRGFya01vZGUiLCJkYXJrTW9kZVBhdGgiLCJpbnRlcm5hbEZyYW1ld29yayIsIkZSQU1FV09SS1MiLCJyZXN1bHQiLCJnZXRHZW5lcmF0ZWRDb250ZW50cyIsImZvbGRlclBhdGgiLCJpc0RldiIsIm1vZGUiLCJvdXRwdXRQYXRoIiwicGF0aCIsImpvaW4iLCJ3cml0ZUZpbGUiLCJKU09OIiwic3RyaW5naWZ5IiwibmFtZSIsImdlbmVyYXRlZEZpbGVzIiwiRXJyb3IiXSwibWFwcGluZ3MiOiJBQUFBLDZCQUE2Qjs7Ozs7Ozs7Ozs7SUFlN0IsT0FTQztlQVREOztJQVdzQkEsYUFBYTtlQUFiQTs7OzsrREF6Qkw7Z0NBRVM7bUNBQ1c7dUJBQ1Y7QUFVWixlQUFmLFNBQStCQyxPQUF3QjtJQUNuRCxJQUFJO1FBQ0EsTUFBTUQsY0FBY0M7UUFFcEIsT0FBTztZQUFFQyxTQUFTO1lBQU1DLGdCQUFnQixDQUFDLG9CQUFvQixFQUFFRixRQUFRRyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQUM7SUFDMUYsRUFBRSxPQUFPQyxHQUFHO1FBQ1JDLFFBQVFDLEtBQUssQ0FBQ0Y7UUFDZCxPQUFPO1lBQUVILFNBQVM7UUFBTTtJQUM1QjtBQUNKO0FBRU8sZUFBZUYsY0FBY0MsT0FBd0I7SUFDeEQsS0FBSyxNQUFNTyxrQkFBa0I7UUFBQztRQUFPO0tBQUssQ0FBRTtRQUN4QyxNQUFNQyxlQUFlRCxpQkFBaUIsVUFBVTtRQUNoRCxLQUFLLE1BQU1FLHFCQUFxQkMsaUJBQVUsQ0FBRTtZQUN4QyxNQUFNQyxTQUFTLE1BQU1DLElBQUFBLHVDQUFvQixFQUFDO2dCQUN0Q0MsWUFBWWIsUUFBUUcsV0FBVztnQkFDL0JNO2dCQUNBRjtnQkFDQU8sT0FBT2QsUUFBUWUsSUFBSSxLQUFLO1lBQzVCO1lBRUEsTUFBTUMsYUFBYUMsYUFBSSxDQUFDQyxJQUFJLENBQUNsQixRQUFRZ0IsVUFBVSxFQUFFUixjQUFjQyxtQkFBbUI7WUFDbEYsTUFBTVUsSUFBQUEseUJBQVMsRUFBQ0gsWUFBWUksS0FBS0MsU0FBUyxDQUFDVjtZQUUzQyxJQUFLLE1BQU1XLFFBQVFYLE9BQU9ZLGNBQWMsQ0FBRTtnQkFDdEMsSUFBSSxPQUFPWixPQUFPWSxjQUFjLENBQUNELEtBQUssS0FBSyxVQUFVO29CQUNqRCxNQUFNLElBQUlFLE1BQU0sQ0FBQyxFQUFFUixXQUFXLHlCQUF5QixDQUFDO2dCQUM1RDtZQUNKO1FBQ0o7SUFDSjtBQUNKIn0=