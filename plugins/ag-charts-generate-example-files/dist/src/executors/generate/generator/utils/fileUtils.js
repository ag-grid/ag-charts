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
    getBoilerPlateFiles: function() {
        return getBoilerPlateFiles;
    },
    getBoilerPlateName: function() {
        return getBoilerPlateName;
    },
    getEntryFileName: function() {
        return getEntryFileName;
    },
    getFileList: function() {
        return getFileList;
    },
    getFrameworkFromInternalFramework: function() {
        return getFrameworkFromInternalFramework;
    },
    getIsEnterprise: function() {
        return getIsEnterprise;
    },
    getMainFileName: function() {
        return getMainFileName;
    },
    getProvidedExampleFiles: function() {
        return getProvidedExampleFiles;
    },
    getProvidedExampleFolder: function() {
        return getProvidedExampleFolder;
    },
    getTransformTsFileExt: function() {
        return getTransformTsFileExt;
    }
});
const _interop_require_default = require("@swc/helpers/_/_interop_require_default");
const _fs = /*#__PURE__*/ _interop_require_default._(require("fs"));
const _path = /*#__PURE__*/ _interop_require_default._(require("path"));
const _types = require("../types");
const BOILER_PLATE_FILE_PATH = './packages/ag-charts-website/public/example-runner';
const getBoilerPlateName = (internalFramework)=>{
    const boilerPlateTemplate = (boilerPlateKey)=>`charts-${boilerPlateKey}-boilerplate`;
    switch(internalFramework){
        case 'reactFunctional':
            return boilerPlateTemplate('react');
        case 'reactFunctionalTs':
            return boilerPlateTemplate('react-ts');
        case 'typescript':
        case 'angular':
        case 'vue':
        case 'vue3':
            return boilerPlateTemplate(internalFramework);
        default:
            return undefined;
    }
};
const getTransformTsFileExt = (internalFramework)=>{
    let transformTsFileExt;
    if (internalFramework === 'reactFunctionalTs') {
        transformTsFileExt = '.tsx';
    } else if (!_types.TYPESCRIPT_INTERNAL_FRAMEWORKS.includes(internalFramework)) {
        transformTsFileExt = '.js';
    }
    return transformTsFileExt;
};
const getBoilerPlateFiles = async (isDev, internalFramework)=>{
    const boilerplateName = getBoilerPlateName(internalFramework);
    if (!boilerplateName) {
        return {};
    }
    const boilerPlatePath = _path.default.join(BOILER_PLATE_FILE_PATH, boilerplateName);
    const fileNames = _fs.default.readdirSync(boilerPlatePath);
    const files = {};
    const fileContentPromises = fileNames.map(async (fileName)=>{
        if (!isDev && fileName === 'systemjs.config.dev.js') {
            // Ignore systemjs dev file if on production
            return;
        }
        const filePath = _path.default.join(boilerPlatePath, fileName);
        try {
            const contents = _fs.default.readFileSync(filePath, 'utf-8');
            if (contents) {
                files[fileName] = contents;
            }
        } catch (e) {
        // Skip missing files.
        }
    });
    await Promise.all(fileContentPromises);
    return files;
};
const getFrameworkFromInternalFramework = (internalFramework)=>{
    switch(internalFramework){
        case 'typescript':
        case 'vanilla':
            return 'javascript';
        case 'reactFunctionalTs':
        case 'reactFunctional':
            return 'react';
        case 'vue':
        case 'vue3':
            return 'vue';
        default:
            return internalFramework;
    }
};
const getEntryFileName = (internalFramework)=>{
    switch(internalFramework){
        case 'typescript':
        case 'angular':
            return 'main.ts';
        case 'reactFunctional':
            return 'index.jsx';
        case 'reactFunctionalTs':
            return 'index.tsx';
        case 'vanilla':
        case 'vue':
        case 'vue3':
            return 'main.js';
        default:
            return;
    }
};
const getMainFileName = (internalFramework)=>{
    switch(internalFramework){
        case 'angular':
            return 'app.component.ts';
        default:
            return getEntryFileName(internalFramework);
    }
};
const getProvidedExampleFolder = ({ folderPath, internalFramework })=>{
    return _path.default.join(folderPath, 'provided/modules', internalFramework);
};
const getProvidedExampleFiles = ({ folderPath, internalFramework })=>{
    const providedFolder = getProvidedExampleFolder({
        folderPath,
        internalFramework
    });
    return _fs.default.existsSync(providedFolder) ? _fs.default.readdirSync(providedFolder) : [];
};
const getFileList = async ({ folderPath, fileList })=>{
    const contentFiles = {};
    await Promise.all(fileList.map(async (fileName)=>{
        try {
            const file = _fs.default.readFileSync(_path.default.join(folderPath, fileName));
            contentFiles[fileName] = file.toString('utf-8');
        } catch (e) {
        // Skip missing files.
        }
    }));
    return contentFiles;
};
const getIsEnterprise = ({ entryFile })=>entryFile == null ? void 0 : entryFile.includes('ag-charts-enterprise');

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3V0aWxzL2ZpbGVVdGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmltcG9ydCB0eXBlIHsgSW50ZXJuYWxGcmFtZXdvcmssIFRyYW5zZm9ybVRzRmlsZUV4dCB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IFRZUEVTQ1JJUFRfSU5URVJOQUxfRlJBTUVXT1JLUyB9IGZyb20gJy4uL3R5cGVzJztcblxuY29uc3QgQk9JTEVSX1BMQVRFX0ZJTEVfUEFUSCA9ICcuL3BhY2thZ2VzL2FnLWNoYXJ0cy13ZWJzaXRlL3B1YmxpYy9leGFtcGxlLXJ1bm5lcic7XG5cbmV4cG9ydCBjb25zdCBnZXRCb2lsZXJQbGF0ZU5hbWUgPSAoaW50ZXJuYWxGcmFtZXdvcms6IEludGVybmFsRnJhbWV3b3JrKSA9PiB7XG4gICAgY29uc3QgYm9pbGVyUGxhdGVUZW1wbGF0ZSA9IChib2lsZXJQbGF0ZUtleTogc3RyaW5nKSA9PiBgY2hhcnRzLSR7Ym9pbGVyUGxhdGVLZXl9LWJvaWxlcnBsYXRlYDtcblxuICAgIHN3aXRjaCAoaW50ZXJuYWxGcmFtZXdvcmspIHtcbiAgICAgICAgY2FzZSAncmVhY3RGdW5jdGlvbmFsJzpcbiAgICAgICAgICAgIHJldHVybiBib2lsZXJQbGF0ZVRlbXBsYXRlKCdyZWFjdCcpO1xuICAgICAgICBjYXNlICdyZWFjdEZ1bmN0aW9uYWxUcyc6XG4gICAgICAgICAgICByZXR1cm4gYm9pbGVyUGxhdGVUZW1wbGF0ZSgncmVhY3QtdHMnKTtcbiAgICAgICAgY2FzZSAndHlwZXNjcmlwdCc6XG4gICAgICAgIGNhc2UgJ2FuZ3VsYXInOlxuICAgICAgICBjYXNlICd2dWUnOlxuICAgICAgICBjYXNlICd2dWUzJzpcbiAgICAgICAgICAgIHJldHVybiBib2lsZXJQbGF0ZVRlbXBsYXRlKGludGVybmFsRnJhbWV3b3JrKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGdldFRyYW5zZm9ybVRzRmlsZUV4dCA9IChpbnRlcm5hbEZyYW1ld29yazogSW50ZXJuYWxGcmFtZXdvcmspOiBUcmFuc2Zvcm1Uc0ZpbGVFeHQgPT4ge1xuICAgIGxldCB0cmFuc2Zvcm1Uc0ZpbGVFeHQ6IFRyYW5zZm9ybVRzRmlsZUV4dDtcbiAgICBpZiAoaW50ZXJuYWxGcmFtZXdvcmsgPT09ICdyZWFjdEZ1bmN0aW9uYWxUcycpIHtcbiAgICAgICAgdHJhbnNmb3JtVHNGaWxlRXh0ID0gJy50c3gnO1xuICAgIH0gZWxzZSBpZiAoIVRZUEVTQ1JJUFRfSU5URVJOQUxfRlJBTUVXT1JLUy5pbmNsdWRlcyhpbnRlcm5hbEZyYW1ld29yaykpIHtcbiAgICAgICAgdHJhbnNmb3JtVHNGaWxlRXh0ID0gJy5qcyc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRyYW5zZm9ybVRzRmlsZUV4dDtcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRCb2lsZXJQbGF0ZUZpbGVzID0gYXN5bmMgKGlzRGV2OiBib29sZWFuLCBpbnRlcm5hbEZyYW1ld29yazogSW50ZXJuYWxGcmFtZXdvcmspID0+IHtcbiAgICBjb25zdCBib2lsZXJwbGF0ZU5hbWUgPSBnZXRCb2lsZXJQbGF0ZU5hbWUoaW50ZXJuYWxGcmFtZXdvcmspO1xuXG4gICAgaWYgKCFib2lsZXJwbGF0ZU5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbiAgICBjb25zdCBib2lsZXJQbGF0ZVBhdGggPSBwYXRoLmpvaW4oQk9JTEVSX1BMQVRFX0ZJTEVfUEFUSCwgYm9pbGVycGxhdGVOYW1lKTtcblxuICAgIGNvbnN0IGZpbGVOYW1lcyA9IGZzLnJlYWRkaXJTeW5jKGJvaWxlclBsYXRlUGF0aCk7XG5cbiAgICBjb25zdCBmaWxlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgIGNvbnN0IGZpbGVDb250ZW50UHJvbWlzZXMgPSBmaWxlTmFtZXMubWFwKGFzeW5jIChmaWxlTmFtZSkgPT4ge1xuICAgICAgICBpZiAoIWlzRGV2ICYmIGZpbGVOYW1lID09PSAnc3lzdGVtanMuY29uZmlnLmRldi5qcycpIHtcbiAgICAgICAgICAgIC8vIElnbm9yZSBzeXN0ZW1qcyBkZXYgZmlsZSBpZiBvbiBwcm9kdWN0aW9uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4oYm9pbGVyUGxhdGVQYXRoLCBmaWxlTmFtZSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb250ZW50cyA9IGZzLnJlYWRGaWxlU3luYyhmaWxlUGF0aCwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICBpZiAoY29udGVudHMpIHtcbiAgICAgICAgICAgICAgICBmaWxlc1tmaWxlTmFtZV0gPSBjb250ZW50cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gU2tpcCBtaXNzaW5nIGZpbGVzLlxuICAgICAgICB9XG4gICAgfSk7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoZmlsZUNvbnRlbnRQcm9taXNlcyk7XG5cbiAgICByZXR1cm4gZmlsZXM7XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0RnJhbWV3b3JrRnJvbUludGVybmFsRnJhbWV3b3JrID0gKGludGVybmFsRnJhbWV3b3JrOiBJbnRlcm5hbEZyYW1ld29yaykgPT4ge1xuICAgIHN3aXRjaCAoaW50ZXJuYWxGcmFtZXdvcmspIHtcbiAgICAgICAgY2FzZSAndHlwZXNjcmlwdCc6XG4gICAgICAgIGNhc2UgJ3ZhbmlsbGEnOlxuICAgICAgICAgICAgcmV0dXJuICdqYXZhc2NyaXB0JztcbiAgICAgICAgY2FzZSAncmVhY3RGdW5jdGlvbmFsVHMnOlxuICAgICAgICBjYXNlICdyZWFjdEZ1bmN0aW9uYWwnOlxuICAgICAgICAgICAgcmV0dXJuICdyZWFjdCc7XG4gICAgICAgIGNhc2UgJ3Z1ZSc6XG4gICAgICAgIGNhc2UgJ3Z1ZTMnOlxuICAgICAgICAgICAgcmV0dXJuICd2dWUnO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIGludGVybmFsRnJhbWV3b3JrO1xuICAgIH1cbn07XG5cbi8qKlxuICogRW50cnkgZmlsZW5hbWUgdG8gZXhlY3V0ZSBjb2RlXG4gKi9cbmV4cG9ydCBjb25zdCBnZXRFbnRyeUZpbGVOYW1lID0gKGludGVybmFsRnJhbWV3b3JrOiBJbnRlcm5hbEZyYW1ld29yaykgPT4ge1xuICAgIHN3aXRjaCAoaW50ZXJuYWxGcmFtZXdvcmspIHtcbiAgICAgICAgY2FzZSAndHlwZXNjcmlwdCc6XG4gICAgICAgIGNhc2UgJ2FuZ3VsYXInOlxuICAgICAgICAgICAgcmV0dXJuICdtYWluLnRzJztcbiAgICAgICAgY2FzZSAncmVhY3RGdW5jdGlvbmFsJzpcbiAgICAgICAgICAgIHJldHVybiAnaW5kZXguanN4JztcbiAgICAgICAgY2FzZSAncmVhY3RGdW5jdGlvbmFsVHMnOlxuICAgICAgICAgICAgcmV0dXJuICdpbmRleC50c3gnO1xuICAgICAgICBjYXNlICd2YW5pbGxhJzpcbiAgICAgICAgY2FzZSAndnVlJzpcbiAgICAgICAgY2FzZSAndnVlMyc6XG4gICAgICAgICAgICByZXR1cm4gJ21haW4uanMnO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgIH1cbn07XG5cbi8qKlxuICogTWFpbiBmaWxlbmFtZSBzaG93aW5nIGNvZGUgdGhhdCBpcyBydW5cbiAqL1xuZXhwb3J0IGNvbnN0IGdldE1haW5GaWxlTmFtZSA9IChpbnRlcm5hbEZyYW1ld29yazogSW50ZXJuYWxGcmFtZXdvcmspID0+IHtcbiAgICBzd2l0Y2ggKGludGVybmFsRnJhbWV3b3JrKSB7XG4gICAgICAgIGNhc2UgJ2FuZ3VsYXInOlxuICAgICAgICAgICAgcmV0dXJuICdhcHAuY29tcG9uZW50LnRzJztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBnZXRFbnRyeUZpbGVOYW1lKGludGVybmFsRnJhbWV3b3JrKTtcbiAgICB9XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0UHJvdmlkZWRFeGFtcGxlRm9sZGVyID0gKHtcbiAgICBmb2xkZXJQYXRoLFxuICAgIGludGVybmFsRnJhbWV3b3JrLFxufToge1xuICAgIGZvbGRlclBhdGg6IHN0cmluZztcbiAgICBpbnRlcm5hbEZyYW1ld29yazogSW50ZXJuYWxGcmFtZXdvcms7XG59KSA9PiB7XG4gICAgcmV0dXJuIHBhdGguam9pbihmb2xkZXJQYXRoLCAncHJvdmlkZWQvbW9kdWxlcycsIGludGVybmFsRnJhbWV3b3JrKTtcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRQcm92aWRlZEV4YW1wbGVGaWxlcyA9ICh7XG4gICAgZm9sZGVyUGF0aCxcbiAgICBpbnRlcm5hbEZyYW1ld29yayxcbn06IHtcbiAgICBmb2xkZXJQYXRoOiBzdHJpbmc7XG4gICAgaW50ZXJuYWxGcmFtZXdvcms6IEludGVybmFsRnJhbWV3b3JrO1xufSkgPT4ge1xuICAgIGNvbnN0IHByb3ZpZGVkRm9sZGVyID0gZ2V0UHJvdmlkZWRFeGFtcGxlRm9sZGVyKHsgZm9sZGVyUGF0aCwgaW50ZXJuYWxGcmFtZXdvcmsgfSk7XG5cbiAgICByZXR1cm4gZnMuZXhpc3RzU3luYyhwcm92aWRlZEZvbGRlcikgPyBmcy5yZWFkZGlyU3luYyhwcm92aWRlZEZvbGRlcikgOiBbXTtcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRGaWxlTGlzdCA9IGFzeW5jICh7IGZvbGRlclBhdGgsIGZpbGVMaXN0IH06IHsgZm9sZGVyUGF0aDogc3RyaW5nOyBmaWxlTGlzdDogc3RyaW5nW10gfSkgPT4ge1xuICAgIGNvbnN0IGNvbnRlbnRGaWxlcyA9IHt9IGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIGZpbGVMaXN0Lm1hcChhc3luYyAoZmlsZU5hbWUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZSA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oZm9sZGVyUGF0aCwgZmlsZU5hbWUpKTtcbiAgICAgICAgICAgICAgICBjb250ZW50RmlsZXNbZmlsZU5hbWVdID0gZmlsZS50b1N0cmluZygndXRmLTgnKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBTa2lwIG1pc3NpbmcgZmlsZXMuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgKTtcblxuICAgIHJldHVybiBjb250ZW50RmlsZXM7XG59O1xuXG4vLyBUT0RPOiBGaW5kIGEgYmV0dGVyIHdheSB0byBkZXRlcm1pbmUgaWYgYW4gZXhhbXBsZSBpcyBlbnRlcnByaXNlIG9yIG5vdFxuZXhwb3J0IGNvbnN0IGdldElzRW50ZXJwcmlzZSA9ICh7IGVudHJ5RmlsZSB9OiB7IGVudHJ5RmlsZTogc3RyaW5nIH0pID0+IGVudHJ5RmlsZT8uaW5jbHVkZXMoJ2FnLWNoYXJ0cy1lbnRlcnByaXNlJyk7XG4iXSwibmFtZXMiOlsiZ2V0Qm9pbGVyUGxhdGVGaWxlcyIsImdldEJvaWxlclBsYXRlTmFtZSIsImdldEVudHJ5RmlsZU5hbWUiLCJnZXRGaWxlTGlzdCIsImdldEZyYW1ld29ya0Zyb21JbnRlcm5hbEZyYW1ld29yayIsImdldElzRW50ZXJwcmlzZSIsImdldE1haW5GaWxlTmFtZSIsImdldFByb3ZpZGVkRXhhbXBsZUZpbGVzIiwiZ2V0UHJvdmlkZWRFeGFtcGxlRm9sZGVyIiwiZ2V0VHJhbnNmb3JtVHNGaWxlRXh0IiwiQk9JTEVSX1BMQVRFX0ZJTEVfUEFUSCIsImludGVybmFsRnJhbWV3b3JrIiwiYm9pbGVyUGxhdGVUZW1wbGF0ZSIsImJvaWxlclBsYXRlS2V5IiwidW5kZWZpbmVkIiwidHJhbnNmb3JtVHNGaWxlRXh0IiwiVFlQRVNDUklQVF9JTlRFUk5BTF9GUkFNRVdPUktTIiwiaW5jbHVkZXMiLCJpc0RldiIsImJvaWxlcnBsYXRlTmFtZSIsImJvaWxlclBsYXRlUGF0aCIsInBhdGgiLCJqb2luIiwiZmlsZU5hbWVzIiwiZnMiLCJyZWFkZGlyU3luYyIsImZpbGVzIiwiZmlsZUNvbnRlbnRQcm9taXNlcyIsIm1hcCIsImZpbGVOYW1lIiwiZmlsZVBhdGgiLCJjb250ZW50cyIsInJlYWRGaWxlU3luYyIsImUiLCJQcm9taXNlIiwiYWxsIiwiZm9sZGVyUGF0aCIsInByb3ZpZGVkRm9sZGVyIiwiZXhpc3RzU3luYyIsImZpbGVMaXN0IiwiY29udGVudEZpbGVzIiwiZmlsZSIsInRvU3RyaW5nIiwiZW50cnlGaWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQXFDYUEsbUJBQW1CO2VBQW5CQTs7SUE3QkFDLGtCQUFrQjtlQUFsQkE7O0lBK0VBQyxnQkFBZ0I7ZUFBaEJBOztJQW9EQUMsV0FBVztlQUFYQTs7SUF2RUFDLGlDQUFpQztlQUFqQ0E7O0lBd0ZBQyxlQUFlO2VBQWZBOztJQWhEQUMsZUFBZTtlQUFmQTs7SUFtQkFDLHVCQUF1QjtlQUF2QkE7O0lBVkFDLHdCQUF3QjtlQUF4QkE7O0lBM0ZBQyxxQkFBcUI7ZUFBckJBOzs7OzZEQTFCRTsrREFDRTt1QkFHOEI7QUFFL0MsTUFBTUMseUJBQXlCO0FBRXhCLE1BQU1ULHFCQUFxQixDQUFDVTtJQUMvQixNQUFNQyxzQkFBc0IsQ0FBQ0MsaUJBQTJCLENBQUMsT0FBTyxFQUFFQSxlQUFlLFlBQVksQ0FBQztJQUU5RixPQUFRRjtRQUNKLEtBQUs7WUFDRCxPQUFPQyxvQkFBb0I7UUFDL0IsS0FBSztZQUNELE9BQU9BLG9CQUFvQjtRQUMvQixLQUFLO1FBQ0wsS0FBSztRQUNMLEtBQUs7UUFDTCxLQUFLO1lBQ0QsT0FBT0Esb0JBQW9CRDtRQUMvQjtZQUNJLE9BQU9HO0lBQ2Y7QUFDSjtBQUVPLE1BQU1MLHdCQUF3QixDQUFDRTtJQUNsQyxJQUFJSTtJQUNKLElBQUlKLHNCQUFz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