import { readAsJsFile } from '../transformation-scripts/parser-utils';
import { getContentsOfFileList } from './fileUtils';
import type { FileContents, TransformTsFileExt } from '../types.d';
import { SOURCE_ENTRY_FILE_NAME } from '../constants';

const getOtherTsGeneratedFiles = async ({
    sourceFileList,
    pageName,
    exampleName,
    transformTsFileExt,
}: {
    sourceFileList: string[];
    pageName: string;
    exampleName: string;
    /**
     * File extension for .ts files to be converted to
     */
    transformTsFileExt?: TransformTsFileExt;
}) => {
    const otherTsFiles = sourceFileList
        .filter((fileName) => fileName.endsWith('.ts'))
        // Exclude source entry file, as it is used to generate framework entry file
        .filter((fileName) => fileName !== SOURCE_ENTRY_FILE_NAME);

    const tsFileContents = await getContentsOfFileList({
        pageName,
        exampleName,
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
    sourceFileList,
    pageName,
    exampleName,
}: {
    sourceFileList: string[];
    pageName: string;
    exampleName: string;
}): Promise<FileContents> => {
    const otherJsFiles = sourceFileList.filter((fileName) => fileName.endsWith('.js'));
    return getContentsOfFileList({
        pageName,
        exampleName,
        fileList: otherJsFiles,
    });
};

export const getOtherScriptFiles = async ({
    sourceFileList,
    pageName,
    exampleName,
    transformTsFileExt,
}: {
    sourceFileList: string[];
    pageName: string;
    exampleName: string;
    transformTsFileExt?: TransformTsFileExt;
}) => {
    const otherTsGeneratedFileContents = await getOtherTsGeneratedFiles({
        sourceFileList,
        pageName,
        exampleName,
        transformTsFileExt,
    });
    const otherJsFileContents = await getOtherJsFiles({
        pageName,
        exampleName,
        sourceFileList,
    });

    const contents = Object.assign({}, otherTsGeneratedFileContents, otherJsFileContents) as FileContents;

    return contents;
};
