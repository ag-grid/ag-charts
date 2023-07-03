import { getContentsOfFileList } from "./fileUtils";

export const getStyleFiles = async ({
  sourceFileList,
  pageName,
  exampleName,
}: {
  sourceFileList: string[];
  pageName: string;
  exampleName: string;
}) => {
  const styleFiles = sourceFileList.filter((fileName) =>
    fileName.endsWith(".css")
  );

  const styleContents = await getContentsOfFileList({
    pageName,
    exampleName,
    fileList: styleFiles,
  });

  return styleContents;
};
