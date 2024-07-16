"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getStyleFiles", {
    enumerable: true,
    get: function() {
        return getStyleFiles;
    }
});
const _fileUtils = require("./fileUtils");
const getStyleFiles = async ({ folderPath, sourceFileList })=>{
    const styleFiles = sourceFileList.filter((fileName)=>fileName.endsWith('.css'));
    const styleContents = await (0, _fileUtils.getFileList)({
        folderPath,
        fileList: styleFiles
    });
    return styleContents;
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3V0aWxzL2dldFN0eWxlRmlsZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2V0RmlsZUxpc3QgfSBmcm9tICcuL2ZpbGVVdGlscyc7XG5cbmV4cG9ydCBjb25zdCBnZXRTdHlsZUZpbGVzID0gYXN5bmMgKHtcbiAgICBmb2xkZXJQYXRoLFxuICAgIHNvdXJjZUZpbGVMaXN0LFxufToge1xuICAgIGZvbGRlclBhdGg6IHN0cmluZztcbiAgICBzb3VyY2VGaWxlTGlzdDogc3RyaW5nW107XG59KSA9PiB7XG4gICAgY29uc3Qgc3R5bGVGaWxlcyA9IHNvdXJjZUZpbGVMaXN0LmZpbHRlcigoZmlsZU5hbWUpID0+IGZpbGVOYW1lLmVuZHNXaXRoKCcuY3NzJykpO1xuXG4gICAgY29uc3Qgc3R5bGVDb250ZW50cyA9IGF3YWl0IGdldEZpbGVMaXN0KHtcbiAgICAgICAgZm9sZGVyUGF0aCxcbiAgICAgICAgZmlsZUxpc3Q6IHN0eWxlRmlsZXMsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gc3R5bGVDb250ZW50cztcbn07XG4iXSwibmFtZXMiOlsiZ2V0U3R5bGVGaWxlcyIsImZvbGRlclBhdGgiLCJzb3VyY2VGaWxlTGlzdCIsInN0eWxlRmlsZXMiLCJmaWx0ZXIiLCJmaWxlTmFtZSIsImVuZHNXaXRoIiwic3R5bGVDb250ZW50cyIsImdldEZpbGVMaXN0IiwiZmlsZUxpc3QiXSwibWFwcGluZ3MiOiI7Ozs7K0JBRWFBOzs7ZUFBQUE7OzsyQkFGZTtBQUVyQixNQUFNQSxnQkFBZ0IsT0FBTyxFQUNoQ0MsVUFBVSxFQUNWQyxjQUFjLEVBSWpCO0lBQ0csTUFBTUMsYUFBYUQsZUFBZUUsTUFBTSxDQUFDLENBQUNDLFdBQWFBLFNBQVNDLFFBQVEsQ0FBQztJQUV6RSxNQUFNQyxnQkFBZ0IsTUFBTUMsSUFBQUEsc0JBQVcsRUFBQztRQUNwQ1A7UUFDQVEsVUFBVU47SUFDZDtJQUVBLE9BQU9JO0FBQ1gifQ==