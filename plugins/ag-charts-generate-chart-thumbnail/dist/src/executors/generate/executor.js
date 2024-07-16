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
const _canvas = require("canvas");
const _path = /*#__PURE__*/ _interop_require_default._(require("path"));
const _path2d = require("path2d");
const _executorsutils = require("../../executors-utils");
const _thumbnailGenerator = require("./generator/thumbnailGenerator");
global.Path2D = _path2d.Path2D;
(0, _path2d.applyPath2DToCanvasRenderingContext)(_canvas.CanvasRenderingContext2D);
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
                    await (0, _thumbnailGenerator.generateThumbnail)({
                        example,
                        theme,
                        outputPath,
                        dpi,
                        mockText: false
                    });
                } catch (e) {
                    throw new Error(`Unable to render example [${name}] with theme [${theme}]: ${e}`);
                }
            }
        }
        // Generate a platform agnostic (font-wise) rendering for visual comparison purposes.
        await (0, _thumbnailGenerator.generateThumbnail)({
            example,
            theme: 'ag-default',
            outputPath,
            dpi: 1,
            mockText: true
        });
    });
    if (timesCalled.error > 0) {
        throw new Error(`Error when rendering example [${name}] - see console output.`);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZXhlY3V0b3IudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuaW1wb3J0IHR5cGUgeyBFeGVjdXRvckNvbnRleHQgfSBmcm9tICdAbngvZGV2a2l0JztcbmltcG9ydCB7IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCB9IGZyb20gJ2NhbnZhcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IFBhdGgyRCwgYXBwbHlQYXRoMkRUb0NhbnZhc1JlbmRlcmluZ0NvbnRleHQgfSBmcm9tICdwYXRoMmQnO1xuXG5pbXBvcnQgdHlwZSB7IEFnQ2hhcnRUaGVtZU5hbWUgfSBmcm9tICdhZy1jaGFydHMtY29tbXVuaXR5JztcblxuaW1wb3J0IHsgY29uc29sZVByZWZpeCwgZW5zdXJlRGlyZWN0b3J5LCByZWFkSlNPTkZpbGUgfSBmcm9tICcuLi8uLi9leGVjdXRvcnMtdXRpbHMnO1xuaW1wb3J0IHsgZ2VuZXJhdGVUaHVtYm5haWwgfSBmcm9tICcuL2dlbmVyYXRvci90aHVtYm5haWxHZW5lcmF0b3InO1xuXG5nbG9iYWwuUGF0aDJEID0gUGF0aDJEO1xuXG5hcHBseVBhdGgyRFRvQ2FudmFzUmVuZGVyaW5nQ29udGV4dChDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpO1xuXG5leHBvcnQgdHlwZSBFeGVjdXRvck9wdGlvbnMgPSB7XG4gICAgb3V0cHV0UGF0aDogc3RyaW5nO1xuICAgIGdlbmVyYXRlZEV4YW1wbGVQYXRoOiBzdHJpbmc7XG59O1xuXG5jb25zdCBUSEVNRVM6IFJlY29yZDxBZ0NoYXJ0VGhlbWVOYW1lLCBib29sZWFuPiA9IHtcbiAgICAnYWctZGVmYXVsdCc6IHRydWUsXG4gICAgJ2FnLWRlZmF1bHQtZGFyayc6IHRydWUsXG4gICAgJ2FnLW1hdGVyaWFsJzogdHJ1ZSxcbiAgICAnYWctbWF0ZXJpYWwtZGFyayc6IHRydWUsXG4gICAgJ2FnLXBvbHljaHJvbWEnOiB0cnVlLFxuICAgICdhZy1wb2x5Y2hyb21hLWRhcmsnOiB0cnVlLFxuICAgICdhZy1zaGVldHMnOiB0cnVlLFxuICAgICdhZy1zaGVldHMtZGFyayc6IHRydWUsXG4gICAgJ2FnLXZpdmlkJzogdHJ1ZSxcbiAgICAnYWctdml2aWQtZGFyayc6IHRydWUsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiAob3B0aW9uczogRXhlY3V0b3JPcHRpb25zLCBjdHg6IEV4ZWN1dG9yQ29udGV4dCkge1xuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGdlbmVyYXRlRmlsZXMob3B0aW9ucywgY3R4KTtcblxuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCB0ZXJtaW5hbE91dHB1dDogYEdlbmVyYXRpbmcgdGh1bWJuYWlscyBmb3IgWyR7b3B0aW9ucy5nZW5lcmF0ZWRFeGFtcGxlUGF0aH1dYCB9O1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UgfTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUZpbGVzKG9wdGlvbnM6IEV4ZWN1dG9yT3B0aW9ucywgY3R4OiBFeGVjdXRvckNvbnRleHQpIHtcbiAgICBjb25zdCB7IGdlbmVyYXRlZEV4YW1wbGVQYXRoLCBvdXRwdXRQYXRoIH0gPSBvcHRpb25zO1xuICAgIGNvbnN0IG5hbWUgPSBgJHtjdHgucHJvamVjdE5hbWV9OiR7Y3R4LnRhcmdldE5hbWV9OiR7Y3R4LmNvbmZpZ3VyYXRpb25OYW1lID8/ICcnfWA7XG4gICAgY29uc3QganNvblBhdGggPSBwYXRoLmpvaW4oZ2VuZXJhdGVkRXhhbXBsZVBhdGgsICdwbGFpbicsICd2YW5pbGxhJywgJ2NvbnRlbnRzLmpzb24nKTtcbiAgICBjb25zdCBleGFtcGxlID0gYXdhaXQgcmVhZEpTT05GaWxlKGpzb25QYXRoKTtcbiAgICBjb25zdCBwcm9kdWN0aW9uID0gWydwcm9kdWN0aW9uJywgJ3N0YWdpbmcnXS5pbmNsdWRlcyhwcm9jZXNzLmVudi5OWF9UQVNLX1RBUkdFVF9DT05GSUdVUkFUSU9OKTtcbiAgICBjb25zdCBkcGlPdXRwdXRzID0gcHJvZHVjdGlvbiA/IFsxLCAyXSA6IFsxXTtcblxuICAgIGlmIChleGFtcGxlID09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gcmVhZCBnZW5lcmF0ZWQgZXhhbXBsZTogWyR7anNvblBhdGh9XWApO1xuICAgIH1cblxuICAgIGF3YWl0IGVuc3VyZURpcmVjdG9yeShvdXRwdXRQYXRoKTtcblxuICAgIGNvbnN0IHRpbWVzQ2FsbGVkID0gYXdhaXQgY29uc29sZVByZWZpeChgWyR7Y3R4LnByb2plY3ROYW1lfV0gYCwgYXN5bmMgKCkgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IHRoZW1lIG9mIE9iamVjdC5rZXlzKFRIRU1FUykgYXMgQWdDaGFydFRoZW1lTmFtZVtdKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGRwaSBvZiBkcGlPdXRwdXRzKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZ2VuZXJhdGVUaHVtYm5haWwoeyBleGFtcGxlLCB0aGVtZSwgb3V0cHV0UGF0aCwgZHBpLCBtb2NrVGV4dDogZmFsc2UgfSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byByZW5kZXIgZXhhbXBsZSBbJHtuYW1lfV0gd2l0aCB0aGVtZSBbJHt0aGVtZX1dOiAke2V9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2VuZXJhdGUgYSBwbGF0Zm9ybSBhZ25vc3RpYyAoZm9udC13aXNlKSByZW5kZXJpbmcgZm9yIHZpc3VhbCBjb21wYXJpc29uIHB1cnBvc2VzLlxuICAgICAgICBhd2FpdCBnZW5lcmF0ZVRodW1ibmFpbCh7IGV4YW1wbGUsIHRoZW1lOiAnYWctZGVmYXVsdCcsIG91dHB1dFBhdGgsIGRwaTogMSwgbW9ja1RleHQ6IHRydWUgfSk7XG4gICAgfSk7XG5cbiAgICBpZiAodGltZXNDYWxsZWQuZXJyb3IgPiAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3Igd2hlbiByZW5kZXJpbmcgZXhhbXBsZSBbJHtuYW1lfV0gLSBzZWUgY29uc29sZSBvdXRwdXQuYCk7XG4gICAgfVxufVxuIl0sIm5hbWVzIjpbImdlbmVyYXRlRmlsZXMiLCJnbG9iYWwiLCJQYXRoMkQiLCJhcHBseVBhdGgyRFRvQ2FudmFzUmVuZGVyaW5nQ29udGV4dCIsIkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCIsIlRIRU1FUyIsIm9wdGlvbnMiLCJjdHgiLCJzdWNjZXNzIiwidGVybWluYWxPdXRwdXQiLCJnZW5lcmF0ZWRFeGFtcGxlUGF0aCIsImUiLCJjb25zb2xlIiwiZXJyb3IiLCJvdXRwdXRQYXRoIiwibmFtZSIsInByb2plY3ROYW1lIiwidGFyZ2V0TmFtZSIsImNvbmZpZ3VyYXRpb25OYW1lIiwianNvblBhdGgiLCJwYXRoIiwiam9pbiIsImV4YW1wbGUiLCJyZWFkSlNPTkZpbGUiLCJwcm9kdWN0aW9uIiwiaW5jbHVkZXMiLCJwcm9jZXNzIiwiZW52IiwiTlhfVEFTS19UQVJHRVRfQ09ORklHVVJBVElPTiIsImRwaU91dHB1dHMiLCJFcnJvciIsImVuc3VyZURpcmVjdG9yeSIsInRpbWVzQ2FsbGVkIiwiY29uc29sZVByZWZpeCIsInRoZW1lIiwiT2JqZWN0Iiwia2V5cyIsImRwaSIsImdlbmVyYXRlVGh1bWJuYWlsIiwibW9ja1RleHQiXSwibWFwcGluZ3MiOiJBQUFBLDZCQUE2Qjs7Ozs7Ozs7Ozs7SUFpQzdCLE9BU0M7ZUFURDs7SUFXc0JBLGFBQWE7ZUFBYkE7Ozs7d0JBMUNtQjsrREFDeEI7d0JBQzJDO2dDQUlDO29DQUMz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