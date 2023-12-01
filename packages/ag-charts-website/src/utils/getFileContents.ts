import { pathJoin } from '@utils/pathJoin';
import fs from 'node:fs/promises';

export const getFileContents = ({ folderUrl, fileName }: { folderUrl: URL; fileName: string }) => {
    const filePath = pathJoin(folderUrl.pathname, fileName);

    return fs.readFile(filePath, 'utf-8');
};
