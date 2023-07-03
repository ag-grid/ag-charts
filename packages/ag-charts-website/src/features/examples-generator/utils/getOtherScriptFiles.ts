import { readAsJsFile } from "../transformation-scripts/parser-utils";
import { getContentsOfFileList } from "./fileUtils";

export type FileContents = Record<string, string>;

const getOtherTsGeneratedFiles = async ({
  sourceEntryFileName,
  sourceFileList,
  pageName,
  exampleName,
}: {
  sourceEntryFileName: string;
  sourceFileList: string[];
  pageName: string;
  exampleName: string;
}) => {
  const otherTsFiles = sourceFileList
    .filter((fileName) => fileName.endsWith(".ts"))
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
    const jsFileName = tsFileName.replace(".ts", ".js");
    generatedFiles[jsFileName] = readAsJsFile(srcFile);
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
  const otherJsFiles = sourceFileList.filter((fileName) =>
    fileName.endsWith(".js")
  );
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
}: {
  sourceEntryFileName: string;
  sourceFileList: string[];
  pageName: string;
  exampleName: string;
}) => {
  const otherTsGeneratedFileContents = await getOtherTsGeneratedFiles({
    sourceEntryFileName,
    sourceFileList,
    pageName,
    exampleName,
  });
  const otherJsFileContents = await getOtherJsFiles({
    pageName,
    exampleName,
    sourceFileList,
  });

  const contents = Object.assign(
    {},
    otherTsGeneratedFileContents,
    otherJsFileContents
  ) as FileContents;

  return contents;
};
