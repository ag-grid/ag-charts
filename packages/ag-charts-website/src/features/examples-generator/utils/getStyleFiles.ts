import { getFileList } from './fileUtils';

export const getStyleFiles = async ({ folderUrl, sourceFileList }: { folderUrl: URL; sourceFileList: string[] }) => {
    const styleFiles = sourceFileList.filter((fileName) => fileName.endsWith('.css'));

    const styleContents = await getFileList({
        folderUrl,
        fileList: styleFiles,
    });

    return styleContents;
};
