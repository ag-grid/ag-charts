import { readAsJsFile } from '../transformation-scripts/parser-utils';
import { getContentsOfFileList } from './fileUtils';
import type { FileContents } from '../types.d';

const getOtherTsGeneratedFiles = async ({
    sourceEntryFileName,
    sourceFileList,
    pageName,
    exampleName,
    transformTsFiles,
}: {
    sourceEntryFileName: string;
    sourceFileList: string[];
    pageName: string;
    exampleName: string;
    /**
     * Whether .ts files get converted to `.js files
     */
    transformTsFiles: boolean;
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
        if (transformTsFiles) {
            const jsFileName = tsFileName.replace('.ts', '.js');
            generatedFiles[jsFileName] = readAsJsFile(srcFile);
        } else {
            generatedFiles[tsFileName] = srcFile;
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
    transformTsFiles,
}: {
    sourceEntryFileName: string;
    sourceFileList: string[];
    pageName: string;
    exampleName: string;
    transformTsFiles: boolean;
}) => {
    const otherTsGeneratedFileContents = await getOtherTsGeneratedFiles({
        sourceEntryFileName,
        sourceFileList,
        pageName,
        exampleName,
        transformTsFiles,
    });
    const otherJsFileContents = await getOtherJsFiles({
        pageName,
        exampleName,
        sourceFileList,
    });

    const contents = Object.assign({}, otherTsGeneratedFileContents, otherJsFileContents) as FileContents;

    return contents;
};
