"use strict";
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
    getGeneratedContents: function() {
        return getGeneratedContents;
    },
    getGeneratedContentsFileList: function() {
        return getGeneratedContentsFileList;
    }
});
const _interop_require_default = require("@swc/helpers/_/_interop_require_default");
const _promises = /*#__PURE__*/ _interop_require_default._(require("fs/promises"));
const _path = /*#__PURE__*/ _interop_require_default._(require("path"));
const _executorsutils = require("../../../executors-utils");
const _constants = require("./constants");
const _transformPlainEntryFile = require("./transformPlainEntryFile");
const _chartvanillasrcparser = /*#__PURE__*/ _interop_require_default._(require("./transformation-scripts/chart-vanilla-src-parser"));
const _fileUtils = require("./utils/fileUtils");
const _frameworkFilesGenerator = require("./utils/frameworkFilesGenerator");
const _getDarkModeSnippet = require("./utils/getDarkModeSnippet");
const _getOtherScriptFiles = require("./utils/getOtherScriptFiles");
const _getPackageJson = require("./utils/getPackageJson");
const _getStyleFiles = require("./utils/getStyleFiles");
const getGeneratedContentsFileList = async (params)=>{
    const { internalFramework, folderPath } = params;
    const entryFileName = (0, _fileUtils.getEntryFileName)(internalFramework);
    const sourceFileList = await _promises.default.readdir(folderPath);
    const scriptFiles = await (0, _getOtherScriptFiles.getOtherScriptFiles)({
        folderPath,
        sourceFileList,
        transformTsFileExt: (0, _fileUtils.getTransformTsFileExt)(internalFramework)
    });
    const styleFiles = await (0, _getStyleFiles.getStyleFiles)({
        folderPath,
        sourceFileList
    });
    // Angular is a special case where the `main.ts` entry file is a boilerplate file
    // and another file is generated from the source file `main.ts`.
    // Both the boilerplate entry file and the generated file need to
    // be added to the generated file list
    const angularFiles = internalFramework === 'angular' ? [
        _constants.ANGULAR_GENERATED_MAIN_FILE_NAME
    ] : [];
    const generatedFileList = [
        'index.html',
        entryFileName
    ].concat(angularFiles).concat(Object.keys(scriptFiles)).concat(Object.keys(styleFiles));
    return generatedFileList;
};
const getGeneratedContents = async (params)=>{
    const { internalFramework, folderPath, ignoreDarkMode, isDev = false } = params;
    let { extractOptions = false } = params;
    const sourceFileList = await _promises.default.readdir(folderPath);
    if (!sourceFileList.includes(_constants.SOURCE_ENTRY_FILE_NAME)) {
        throw new Error('Unable to find example entry-point at: ' + folderPath);
    }
    const entryFile = await (0, _executorsutils.readFile)(_path.default.join(folderPath, _constants.SOURCE_ENTRY_FILE_NAME));
    const indexHtml = await (0, _executorsutils.readFile)(_path.default.join(folderPath, 'index.html'));
    extractOptions || (extractOptions = entryFile.includes('@ag-options-extract'));
    const otherScriptFiles = await (0, _getOtherScriptFiles.getOtherScriptFiles)({
        folderPath,
        sourceFileList,
        transformTsFileExt: (0, _fileUtils.getTransformTsFileExt)(internalFramework)
    });
    const providedExampleFileNames = (0, _fileUtils.getProvidedExampleFiles)({
        folderPath,
        internalFramework
    });
    const providedExampleBasePath = (0, _fileUtils.getProvidedExampleFolder)({
        folderPath,
        internalFramework
    });
    const mainEntryFilename = (0, _fileUtils.getEntryFileName)(internalFramework);
    const providedExampleEntries = await Promise.all(providedExampleFileNames.map(async (fileName)=>{
        let contents = (await _promises.default.readFile(_path.default.join(providedExampleBasePath, fileName))).toString('utf-8');
        if (fileName === mainEntryFilename && !ignoreDarkMode) {
            contents = contents + '\n' + (0, _getDarkModeSnippet.getDarkModeSnippet)();
        }
        return [
            fileName,
            contents
        ];
    }));
    const providedExamples = Object.fromEntries(providedExampleEntries);
    const styleFiles = await (0, _getStyleFiles.getStyleFiles)({
        folderPath,
        sourceFileList
    });
    const isEnterprise = (0, _fileUtils.getIsEnterprise)({
        entryFile
    });
    const { bindings, typedBindings } = (0, _chartvanillasrcparser.default)({
        srcFile: entryFile,
        html: indexHtml,
        exampleSettings: {
            enterprise: isEnterprise
        }
    });
    const getFrameworkFiles = _frameworkFilesGenerator.frameworkFilesGenerator[internalFramework];
    if (!getFrameworkFiles) {
        throw new Error(`No entry file config generator for '${internalFramework}'`);
    }
    const packageJson = (0, _getPackageJson.getPackageJson)({
        isEnterprise,
        internalFramework
    });
    const { files, boilerPlateFiles, scriptFiles, entryFileName, mainFileName } = await getFrameworkFiles({
        entryFile,
        indexHtml,
        isEnterprise,
        bindings,
        typedBindings,
        otherScriptFiles,
        ignoreDarkMode,
        isDev
    });
    if (internalFramework === 'vanilla' && ignoreDarkMode === true && extractOptions) {
        const { optionsById } = (0, _transformPlainEntryFile.transformPlainEntryFile)(files[entryFileName], [
            files['data.js']
        ]);
        const jsonOptions = {};
        for (const [id, options] of optionsById){
            jsonOptions[id] = options;
        }
        // NOTE: This works well for static options structures where JSON.stringify() is sufficient,
        // but doesn't support cases using callback functions.
        //
        // The NPM package `serialize-javascript` can deal with trivial cases, but non-trivial cases
        // such as a callback that uses another function declared in the example are not handled well.
        files['_options.json'] = JSON.stringify(jsonOptions);
    }
    const result = {
        isEnterprise,
        scriptFiles: scriptFiles,
        styleFiles: Object.keys(styleFiles),
        sourceFileList,
        // Replace files with provided examples
        files: Object.assign(styleFiles, files, providedExamples),
        // Files without provided examples
        generatedFiles: files,
        boilerPlateFiles: boilerPlateFiles,
        providedExamples,
        entryFileName,
        mainFileName,
        packageJson
    };
    return result;
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL2V4YW1wbGVzR2VuZXJhdG9yLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmcyBmcm9tICdmcy9wcm9taXNlcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuaW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tICcuLi8uLi8uLi9leGVjdXRvcnMtdXRpbHMnO1xuaW1wb3J0IHsgQU5HVUxBUl9HRU5FUkFURURfTUFJTl9GSUxFX05BTUUsIFNPVVJDRV9FTlRSWV9GSUxFX05BTUUgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyB0cmFuc2Zvcm1QbGFpbkVudHJ5RmlsZSB9IGZyb20gJy4vdHJhbnNmb3JtUGxhaW5FbnRyeUZpbGUnO1xuaW1wb3J0IGNoYXJ0VmFuaWxsYVNyY1BhcnNlciBmcm9tICcuL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvY2hhcnQtdmFuaWxsYS1zcmMtcGFyc2VyJztcbmltcG9ydCB0eXBlIHsgR2VuZXJhdGVkQ29udGVudHMsIEludGVybmFsRnJhbWV3b3JrIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge1xuICAgIGdldEVudHJ5RmlsZU5hbWUsXG4gICAgZ2V0SXNFbnRlcnByaXNlLFxuICAgIGdldFByb3ZpZGVkRXhhbXBsZUZpbGVzLFxuICAgIGdldFByb3ZpZGVkRXhhbXBsZUZvbGRlcixcbiAgICBnZXRUcmFuc2Zvcm1Uc0ZpbGVFeHQsXG59IGZyb20gJy4vdXRpbHMvZmlsZVV0aWxzJztcbmltcG9ydCB7IGZyYW1ld29ya0ZpbGVzR2VuZXJhdG9yIH0gZnJvbSAnLi91dGlscy9mcmFtZXdvcmtGaWxlc0dlbmVyYXRvcic7XG5pbXBvcnQgeyBnZXREYXJrTW9kZVNuaXBwZXQgfSBmcm9tICcuL3V0aWxzL2dldERhcmtNb2RlU25pcHBldCc7XG5pbXBvcnQgeyBnZXRPdGhlclNjcmlwdEZpbGVzIH0gZnJvbSAnLi91dGlscy9nZXRPdGhlclNjcmlwdEZpbGVzJztcbmltcG9ydCB7IGdldFBhY2thZ2VKc29uIH0gZnJvbSAnLi91dGlscy9nZXRQYWNrYWdlSnNvbic7XG5pbXBvcnQgeyBnZXRTdHlsZUZpbGVzIH0gZnJvbSAnLi91dGlscy9nZXRTdHlsZUZpbGVzJztcblxudHlwZSBGaWxlTGlzdFBhcmFtcyA9IHtcbiAgICBpbnRlcm5hbEZyYW1ld29yazogSW50ZXJuYWxGcmFtZXdvcms7XG4gICAgZm9sZGVyUGF0aDogc3RyaW5nO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGZpbGUgbGlzdCBvZiB0aGUgZ2VuZXJhdGVkIGNvbnRlbnRzXG4gKiAod2l0aG91dCBnZW5lcmF0aW5nIHRoZSBjb250ZW50cylcbiAqL1xuZXhwb3J0IGNvbnN0IGdldEdlbmVyYXRlZENvbnRlbnRzRmlsZUxpc3QgPSBhc3luYyAocGFyYW1zOiBGaWxlTGlzdFBhcmFtcyk6IFByb21pc2U8c3RyaW5nW10+ID0+IHtcbiAgICBjb25zdCB7IGludGVybmFsRnJhbWV3b3JrLCBmb2xkZXJQYXRoIH0gPSBwYXJhbXM7XG5cbiAgICBjb25zdCBlbnRyeUZpbGVOYW1lID0gZ2V0RW50cnlGaWxlTmFtZShpbnRlcm5hbEZyYW1ld29yaykhO1xuICAgIGNvbnN0IHNvdXJjZUZpbGVMaXN0ID0gYXdhaXQgZnMucmVhZGRpcihmb2xkZXJQYXRoKTtcblxuICAgIGNvbnN0IHNjcmlwdEZpbGVzID0gYXdhaXQgZ2V0T3RoZXJTY3JpcHRGaWxlcyh7XG4gICAgICAgIGZvbGRlclBhdGgsXG4gICAgICAgIHNvdXJjZUZpbGVMaXN0LFxuICAgICAgICB0cmFuc2Zvcm1Uc0ZpbGVFeHQ6IGdldFRyYW5zZm9ybVRzRmlsZUV4dChpbnRlcm5hbEZyYW1ld29yayksXG4gICAgfSk7XG4gICAgY29uc3Qgc3R5bGVGaWxlcyA9IGF3YWl0IGdldFN0eWxlRmlsZXMoe1xuICAgICAgICBmb2xkZXJQYXRoLFxuICAgICAgICBzb3VyY2VGaWxlTGlzdCxcbiAgICB9KTtcbiAgICAvLyBBbmd1bGFyIGlzIGEgc3BlY2lhbCBjYXNlIHdoZXJlIHRoZSBgbWFpbi50c2AgZW50cnkgZmlsZSBpcyBhIGJvaWxlcnBsYXRlIGZpbGVcbiAgICAvLyBhbmQgYW5vdGhlciBmaWxlIGlzIGdlbmVyYXRlZCBmcm9tIHRoZSBzb3VyY2UgZmlsZSBgbWFpbi50c2AuXG4gICAgLy8gQm90aCB0aGUgYm9pbGVycGxhdGUgZW50cnkgZmlsZSBhbmQgdGhlIGdlbmVyYXRlZCBmaWxlIG5lZWQgdG9cbiAgICAvLyBiZSBhZGRlZCB0byB0aGUgZ2VuZXJhdGVkIGZpbGUgbGlzdFxuICAgIGNvbnN0IGFuZ3VsYXJGaWxlcyA9IGludGVybmFsRnJhbWV3b3JrID09PSAnYW5ndWxhcicgPyBbQU5HVUxBUl9HRU5FUkFURURfTUFJTl9GSUxFX05BTUVdIDogW107XG5cbiAgICBjb25zdCBnZW5lcmF0ZWRGaWxlTGlzdCA9IFsnaW5kZXguaHRtbCcsIGVudHJ5RmlsZU5hbWVdXG4gICAgICAgIC5jb25jYXQoYW5ndWxhckZpbGVzKVxuICAgICAgICAuY29uY2F0KE9iamVjdC5rZXlzKHNjcmlwdEZpbGVzKSlcbiAgICAgICAgLmNvbmNhdChPYmplY3Qua2V5cyhzdHlsZUZpbGVzKSk7XG5cbiAgICByZXR1cm4gZ2VuZXJhdGVkRmlsZUxpc3Q7XG59O1xuXG50eXBlIEdlbmVyYXRlZENvbnRlbnRQYXJhbXMgPSB7XG4gICAgaW50ZXJuYWxGcmFtZXdvcms6IEludGVybmFsRnJhbWV3b3JrO1xuICAgIGZvbGRlclBhdGg6IHN0cmluZztcbiAgICBpZ25vcmVEYXJrTW9kZT86IGJvb2xlYW47XG4gICAgaXNEZXY/OiBib29sZWFuO1xuICAgIGV4dHJhY3RPcHRpb25zPzogYm9vbGVhbjtcbn07XG5cbi8qKlxuICogR2V0IGdlbmVyYXRlZCBjb250ZW50cyBmb3IgYW4gZXhhbXBsZVxuICovXG5leHBvcnQgY29uc3QgZ2V0R2VuZXJhdGVkQ29udGVudHMgPSBhc3luYyAocGFyYW1zOiBHZW5lcmF0ZWRDb250ZW50UGFyYW1zKTogUHJvbWlzZTxHZW5lcmF0ZWRDb250ZW50cyB8IHVuZGVmaW5lZD4gPT4ge1xuICAgIGNvbnN0IHsgaW50ZXJuYWxGcmFtZXdvcmssIGZvbGRlclBhdGgsIGlnbm9yZURhcmtNb2RlLCBpc0RldiA9IGZhbHNlIH0gPSBwYXJhbXM7XG4gICAgbGV0IHsgZXh0cmFjdE9wdGlvbnMgPSBmYWxzZSB9ID0gcGFyYW1zO1xuICAgIGNvbnN0IHNvdXJjZUZpbGVMaXN0ID0gYXdhaXQgZnMucmVhZGRpcihmb2xkZXJQYXRoKTtcblxuICAgIGlmICghc291cmNlRmlsZUxpc3QuaW5jbHVkZXMoU09VUkNFX0VOVFJZX0ZJTEVfTkFNRSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gZmluZCBleGFtcGxlIGVudHJ5LXBvaW50IGF0OiAnICsgZm9sZGVyUGF0aCk7XG4gICAgfVxuXG4gICAgY29uc3QgZW50cnlGaWxlID0gYXdhaXQgcmVhZEZpbGUocGF0aC5qb2luKGZvbGRlclBhdGgsIFNPVVJDRV9FTlRSWV9GSUxFX05BTUUpKTtcbiAgICBjb25zdCBpbmRleEh0bWwgPSBhd2FpdCByZWFkRmlsZShwYXRoLmpvaW4oZm9sZGVyUGF0aCwgJ2luZGV4Lmh0bWwnKSk7XG4gICAgZXh0cmFjdE9wdGlvbnMgfHw9IGVudHJ5RmlsZS5pbmNsdWRlcygnQGFnLW9wdGlvbnMtZXh0cmFjdCcpO1xuXG4gICAgY29uc3Qgb3RoZXJTY3JpcHRGaWxlcyA9IGF3YWl0IGdldE90aGVyU2NyaXB0RmlsZXMoe1xuICAgICAgICBmb2xkZXJQYXRoLFxuICAgICAgICBzb3VyY2VGaWxlTGlzdCxcbiAgICAgICAgdHJhbnNmb3JtVHNGaWxlRXh0OiBnZXRUcmFuc2Zvcm1Uc0ZpbGVFeHQoaW50ZXJuYWxGcmFtZXdvcmspLFxuICAgIH0pO1xuICAgIGNvbnN0IHByb3ZpZGVkRXhhbXBsZUZpbGVOYW1lcyA9IGdldFByb3ZpZGVkRXhhbXBsZUZpbGVzKHsgZm9sZGVyUGF0aCwgaW50ZXJuYWxGcmFtZXdvcmsgfSk7XG5cbiAgICBjb25zdCBwcm92aWRlZEV4YW1wbGVCYXNlUGF0aCA9IGdldFByb3ZpZGVkRXhhbXBsZUZvbGRlcih7XG4gICAgICAgIGZvbGRlclBhdGgsXG4gICAgICAgIGludGVybmFsRnJhbWV3b3JrLFxuICAgIH0pO1xuICAgIGNvbnN0IG1haW5FbnRyeUZpbGVuYW1lID0gZ2V0RW50cnlGaWxlTmFtZShpbnRlcm5hbEZyYW1ld29yayk7XG4gICAgY29uc3QgcHJvdmlkZWRFeGFtcGxlRW50cmllcyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICBwcm92aWRlZEV4YW1wbGVGaWxlTmFtZXMubWFwKGFzeW5jIChmaWxlTmFtZSkgPT4ge1xuICAgICAgICAgICAgbGV0IGNvbnRlbnRzID0gKGF3YWl0IGZzLnJlYWRGaWxlKHBhdGguam9pbihwcm92aWRlZEV4YW1wbGVCYXNlUGF0aCwgZmlsZU5hbWUpKSkudG9TdHJpbmcoJ3V0Zi04Jyk7XG5cbiAgICAgICAgICAgIGlmIChmaWxlTmFtZSA9PT0gbWFpbkVudHJ5RmlsZW5hbWUgJiYgIWlnbm9yZURhcmtNb2RlKSB7XG4gICAgICAgICAgICAgICAgY29udGVudHMgPSBjb250ZW50cyArICdcXG4nICsgZ2V0RGFya01vZGVTbmlwcGV0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBbZmlsZU5hbWUsIGNvbnRlbnRzXTtcbiAgICAgICAgfSlcbiAgICApO1xuICAgIGNvbnN0IHByb3ZpZGVkRXhhbXBsZXMgPSBPYmplY3QuZnJvbUVudHJpZXMocHJvdmlkZWRFeGFtcGxlRW50cmllcyk7XG5cbiAgICBjb25zdCBzdHlsZUZpbGVzID0gYXdhaXQgZ2V0U3R5bGVGaWxlcyh7IGZvbGRlclBhdGgsIHNvdXJjZUZpbGVMaXN0IH0pO1xuXG4gICAgY29uc3QgaXNFbnRlcnByaXNlID0gZ2V0SXNFbnRlcnByaXNlKHsgZW50cnlGaWxlIH0pO1xuXG4gICAgY29uc3QgeyBiaW5kaW5ncywgdHlwZWRCaW5kaW5ncyB9ID0gY2hhcnRWYW5pbGxhU3JjUGFyc2VyKHtcbiAgICAgICAgc3JjRmlsZTogZW50cnlGaWxlLFxuICAgICAgICBodG1sOiBpbmRleEh0bWwsXG4gICAgICAgIGV4YW1wbGVTZXR0aW5nczoge1xuICAgICAgICAgICAgZW50ZXJwcmlzZTogaXNFbnRlcnByaXNlLFxuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgZ2V0RnJhbWV3b3JrRmlsZXMgPSBmcmFtZXdvcmtGaWxlc0dlbmVyYXRvcltpbnRlcm5hbEZyYW1ld29ya107XG4gICAgaWYgKCFnZXRGcmFtZXdvcmtGaWxlcykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIGVudHJ5IGZpbGUgY29uZmlnIGdlbmVyYXRvciBmb3IgJyR7aW50ZXJuYWxGcmFtZXdvcmt9J2ApO1xuICAgIH1cbiAgICBjb25zdCBwYWNrYWdlSnNvbiA9IGdldFBhY2thZ2VKc29uKHtcbiAgICAgICAgaXNFbnRlcnByaXNlLFxuICAgICAgICBpbnRlcm5hbEZyYW1ld29yayxcbiAgICB9KTtcblxuICAgIGNvbnN0IHsgZmlsZXMsIGJvaWxlclBsYXRlRmlsZXMsIHNjcmlwdEZpbGVzLCBlbnRyeUZpbGVOYW1lLCBtYWluRmlsZU5hbWUgfSA9IGF3YWl0IGdldEZyYW1ld29ya0ZpbGVzKHtcbiAgICAgICAgZW50cnlGaWxlLFxuICAgICAgICBpbmRleEh0bWwsXG4gICAgICAgIGlzRW50ZXJwcmlzZSxcbiAgICAgICAgYmluZGluZ3MsXG4gICAgICAgIHR5cGVkQmluZGluZ3MsXG4gICAgICAgIG90aGVyU2NyaXB0RmlsZXMsXG4gICAgICAgIGlnbm9yZURhcmtNb2RlLFxuICAgICAgICBpc0RldixcbiAgICB9KTtcblxuICAgIGlmIChpbnRlcm5hbEZyYW1ld29yayA9PT0gJ3ZhbmlsbGEnICYmIGlnbm9yZURhcmtNb2RlID09PSB0cnVlICYmIGV4dHJhY3RPcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IHsgb3B0aW9uc0J5SWQgfSA9IHRyYW5zZm9ybVBsYWluRW50cnlGaWxlKGZpbGVzW2VudHJ5RmlsZU5hbWVdLCBbZmlsZXNbJ2RhdGEuanMnXV0pO1xuXG4gICAgICAgIGNvbnN0IGpzb25PcHRpb25zID0ge307XG4gICAgICAgIGZvciAoY29uc3QgW2lkLCBvcHRpb25zXSBvZiBvcHRpb25zQnlJZCkge1xuICAgICAgICAgICAganNvbk9wdGlvbnNbaWRdID0gb3B0aW9ucztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5PVEU6IFRoaXMgd29ya3Mgd2VsbCBmb3Igc3RhdGljIG9wdGlvbnMgc3RydWN0dXJlcyB3aGVyZSBKU09OLnN0cmluZ2lmeSgpIGlzIHN1ZmZpY2llbnQsXG4gICAgICAgIC8vIGJ1dCBkb2Vzbid0IHN1cHBvcnQgY2FzZXMgdXNpbmcgY2FsbGJhY2sgZnVuY3Rpb25zLlxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgTlBNIHBhY2thZ2UgYHNlcmlhbGl6ZS1qYXZhc2NyaXB0YCBjYW4gZGVhbCB3aXRoIHRyaXZpYWwgY2FzZXMsIGJ1dCBub24tdHJpdmlhbCBjYXNlc1xuICAgICAgICAvLyBzdWNoIGFzIGEgY2FsbGJhY2sgdGhhdCB1c2VzIGFub3RoZXIgZnVuY3Rpb24gZGVjbGFyZWQgaW4gdGhlIGV4YW1wbGUgYXJlIG5vdCBoYW5kbGVkIHdlbGwuXG4gICAgICAgIGZpbGVzWydfb3B0aW9ucy5qc29uJ10gPSBKU09OLnN0cmluZ2lmeShqc29uT3B0aW9ucyk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0OiBHZW5lcmF0ZWRDb250ZW50cyA9IHtcbiAgICAgICAgaXNFbnRlcnByaXNlLFxuICAgICAgICBzY3JpcHRGaWxlczogc2NyaXB0RmlsZXMhLFxuICAgICAgICBzdHlsZUZpbGVzOiBPYmplY3Qua2V5cyhzdHlsZUZpbGVzKSxcbiAgICAgICAgc291cmNlRmlsZUxpc3QsXG4gICAgICAgIC8vIFJlcGxhY2UgZmlsZXMgd2l0aCBwcm92aWRlZCBleGFtcGxlc1xuICAgICAgICBmaWxlczogT2JqZWN0LmFzc2lnbihzdHlsZUZpbGVzLCBmaWxlcywgcHJvdmlkZWRFeGFtcGxlcyksXG4gICAgICAgIC8vIEZpbGVzIHdpdGhvdXQgcHJvdmlkZWQgZXhhbXBsZXNcbiAgICAgICAgZ2VuZXJhdGVkRmlsZXM6IGZpbGVzLFxuICAgICAgICBib2lsZXJQbGF0ZUZpbGVzOiBib2lsZXJQbGF0ZUZpbGVzISxcbiAgICAgICAgcHJvdmlkZWRFeGFtcGxlcyxcbiAgICAgICAgZW50cnlGaWxlTmFtZSxcbiAgICAgICAgbWFpbkZpbGVOYW1lLFxuICAgICAgICBwYWNrYWdlSnNvbixcbiAgICB9O1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG4iXSwibmFtZXMiOlsiZ2V0R2VuZXJhdGVkQ29udGVudHMiLCJnZXRHZW5lcmF0ZWRDb250ZW50c0ZpbGVMaXN0IiwicGFyYW1zIiwiaW50ZXJuYWxGcmFtZXdvcmsiLCJmb2xkZXJQYXRoIiwiZW50cnlGaWxlTmFtZSIsImdldEVudHJ5RmlsZU5hbWUiLCJzb3VyY2VGaWxlTGlzdCIsImZzIiwicmVhZGRpciIsInNjcmlwdEZpbGVzIiwiZ2V0T3RoZXJTY3JpcHRGaWxlcyIsInRyYW5zZm9ybVRzRmlsZUV4dCIsImdldFRyYW5zZm9ybVRzRmlsZUV4dCIsInN0eWxlRmlsZXMiLCJnZXRTdHlsZUZpbGVzIiwiYW5ndWxhckZpbGVzIiwiQU5HVUxBUl9HRU5FUkFURURfTUFJTl9GSUxFX05BTUUiLCJnZW5lcmF0ZWRGaWxlTGlzdCIsImNvbmNhdCIsIk9iamVjdCIsImtleXMiLCJpZ25vcmVEYXJrTW9kZSIsImlzRGV2IiwiZXh0cmFjdE9wdGlvbnMiLCJpbmNsdWRlcyIsIlNPVVJDRV9FTlRSWV9GSUxFX05BTUUiLCJFcnJvciIsImVudHJ5RmlsZSIsInJlYWRGaWxlIiwicGF0aCIsImpvaW4iLCJpbmRleEh0bWwiLCJvdGhlclNjcmlwdEZpbGVzIiwicHJvdmlkZWRFeGFtcGxlRmlsZU5hbWVzIiwiZ2V0UHJvdmlkZWRFeGFtcGxlRmlsZXMiLCJwcm92aWRlZEV4YW1wbGVCYXNlUGF0aCIsImdldFByb3ZpZGVkRXhhbXBsZUZvbGRlciIsIm1haW5FbnRyeUZpbGVuYW1lIiwicHJvdmlkZWRFeGFtcGxlRW50cmllcyIsIlByb21pc2UiLCJhbGwiLCJtYXAiLCJmaWxlTmFtZSIsImNvbnRlbnRzIiwidG9TdHJpbmciLCJnZXREYXJrTW9kZVNuaXBwZXQiLCJwcm92aWRlZEV4YW1wbGVzIiwiZnJvbUVudHJpZXMiLCJpc0VudGVycHJpc2UiLCJnZXRJc0VudGVycHJpc2UiLCJiaW5kaW5ncyIsInR5cGVkQmluZGluZ3MiLCJjaGFydFZhbmlsbGFTcmNQYXJzZXIiLCJzcmNGaWxlIiwiaHRtbCIsImV4YW1wbGVTZXR0aW5ncyIsImVudGVycHJpc2UiLCJnZXRGcmFtZXdvcmtGaWxlcyIsImZyYW1ld29ya0ZpbGVzR2VuZXJhdG9yIiwicGFja2FnZUpzb24iLCJnZXRQYWNrYWdlSnNvbiIsImZpbGVzIiwiYm9pbGVyUGxhdGVGaWxlcyIsIm1haW5GaWxlTmFtZSIsIm9wdGlvbnNCeUlkIiwidHJhbnNmb3JtUGxhaW5FbnRyeUZpbGUiLCJqc29uT3B0aW9ucyIsImlkIiwib3B0aW9ucyIsIkpTT04iLCJzdHJpbmdpZnkiLCJyZXN1bHQiLCJhc3NpZ24iLCJnZW5lcmF0ZWRGaWxlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFzRWFBLG9CQUFvQjtlQUFwQkE7O0lBeENBQyw0QkFBNEI7ZUFBNUJBOzs7O21FQTlCRTsrREFDRTtnQ0FFUTsyQkFDZ0Q7eUNBQ2pDO2dGQUNOOzJCQVEzQjt5Q0FDaUM7b0NBQ0w7cUNBQ0M7Z0NBQ0w7K0JBQ0Q7QUFXdkIsTUFBTUEsK0JBQStCLE9BQU9DO0lBQy9DLE1BQU0sRUFBRUMsaUJBQWlCLEVBQUVDLFVBQVUsRUFBRSxHQUFHRjtJQUUxQyxNQUFNRyxnQkFBZ0JDLElBQUFBLDJCQUFnQixFQUFDSDtJQUN2QyxNQUFNSSxpQkFBaUIsTUFBTUMsaUJBQUUsQ0FBQ0MsT0FBTyxDQUFDTDtJQUV4QyxNQUFNTSxjQUFjLE1BQU1DLElB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