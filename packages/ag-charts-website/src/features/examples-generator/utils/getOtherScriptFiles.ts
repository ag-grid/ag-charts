import { readAsJsFile } from '../transformation-scripts/parser-utils';
import { getContentsOfFileList } from './fileUtils';
import type { FileContents } from '../types.d';

type TransformTsFileExt = undefined | '.js' | '.tsx';

const getOtherTsGeneratedFiles = async ({
    sourceEntryFileName,
    sourceFileList,
    pageName,
    exampleName,
    transformTsFileExt,
}: {
    sourceEntryFileName: string;
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
        // Exclude entry file
        .filter((fileName) => fileName !== sourceEntryFileName);

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
    sourceEntryFileName,
    sourceFileList,
    pageName,
    exampleName,
    transformTsFileExt,
}: {
    sourceEntryFileName: string;
    sourceFileList: string[];
    pageName: string;
    exampleName: string;
    transformTsFileExt: TransformTsFileExt;
}) => {
    const otherTsGeneratedFileContents = await getOtherTsGeneratedFiles({
        sourceEntryFileName,
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
