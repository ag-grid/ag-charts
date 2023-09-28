import { SOURCE_ENTRY_FILE_NAME } from '../constants';
import { readAsJsFile } from '../transformation-scripts/parser-utils';
import type { FileContents, TransformTsFileExt } from '../types.d';
import { getFileList } from './fileUtils';

const getOtherTsGeneratedFiles = async ({
    folderUrl,
    sourceFileList,
    transformTsFileExt,
}: {
    folderUrl: URL;
    sourceFileList: string[];
    /**
     * File extension for .ts files to be converted to
     */
    transformTsFileExt?: TransformTsFileExt;
}) => {
    const otherTsFiles = sourceFileList
        .filter((fileName) => fileName.endsWith('.ts'))
        // Exclude source entry file, as it is used to generate framework entry file
        .filter((fileName) => fileName !== SOURCE_ENTRY_FILE_NAME);

    const tsFileContents = await getFileList({
        folderUrl,
        fileList: otherTsFiles,
    });

    const generatedFiles = {} as FileContents;
    Object.keys(tsFileContents).forEach((tsFileName) => {
        const srcFile = tsFileContents[tsFileName];
        if (transformTsFileExt === '.tsx') {
            const tsxFileName = tsFileName.replace('.ts', '.tsx');
            generatedFiles[tsxFileName] = srcFile;
        } else if (transformTsFileExt === undefined) {
            generatedFiles[tsFileName] = srcFile;
        } else {
            const jsFileName = tsFileName.replace('.ts', transformTsFileExt);
            generatedFiles[jsFileName] = readAsJsFile(srcFile);
        }
    });

    return generatedFiles;
};

const getOtherJsFiles = ({
    folderUrl,
    sourceFileList,
}: {
    folderUrl: URL;
    sourceFileList: string[];
}): Promise<FileContents> => {
    const otherJsFiles = sourceFileList.filter((fileName) => fileName.endsWith('.js'));
    return getFileList({
        folderUrl,
        fileList: otherJsFiles,
    });
};

export const getOtherScriptFiles = async ({
    folderUrl,
    sourceFileList,
    transformTsFileExt,
}: {
    folderUrl: URL;
    sourceFileList: string[];
    transformTsFileExt?: TransformTsFileExt;
}) => {
    const otherTsGeneratedFileContents = await getOtherTsGeneratedFiles({
        folderUrl,
        sourceFileList,
        transformTsFileExt,
    });
    const otherJsFileContents = await getOtherJsFiles({
        folderUrl,
        sourceFileList,
    });

    const contents = Object.assign({}, otherTsGeneratedFileContents, otherJsFileContents) as FileContents;

    return contents;
};
