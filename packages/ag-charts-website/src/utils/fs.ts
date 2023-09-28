import fsOriginal from 'node:fs';
import fs from 'node:fs/promises';

import { pathJoin } from './pathJoin';

/**
 * Get folders on a root path (1 level deep)
 */
export const getFolders = async (rootPath: string) => {
    const folders: string[] = [];
    const exists = fsOriginal.existsSync(rootPath);
    if (exists) {
        const files = await fs.readdir(rootPath);
        await Promise.all(
            files.map(async (name) => {
                const filePath = pathJoin(rootPath, name);
                const isDirectory = (await fs.stat(filePath)).isDirectory();
                if (isDirectory) {
                    folders.push(name);
                }
            })
        );
    }

    return folders;
};

export async function getFilesRecursively(dir: string, allFiles: string[] = []) {
    allFiles = allFiles || [];
    const files = await fs.readdir(dir);

    await Promise.all(
        files.map(async (file) => {
            const name = pathJoin(dir, file);

            const isDirectory = (await fs.stat(name)).isDirectory();

            if (isDirectory) {
                await getFilesRecursively(name, allFiles);
            } else {
                allFiles.push(name);
            }
        })
    );

    return allFiles;
}

export async function getFoldersRecursively({ dir, allFolders = [] }: { dir: string; allFolders?: string[] }) {
    const files = await fs.readdir(dir);

    await Promise.all(
        files.map(async (file) => {
            const name = pathJoin(dir, file);
            const isDirectory = (await fs.stat(name)).isDirectory();

            if (isDirectory) {
                allFolders.push(name);
                await getFoldersRecursively({ dir: name, allFolders });
            }
        })
    );

    return allFolders;
}

export async function getFilePathsRecursively(dir: string, allFiles: string[] = []) {
    allFiles = allFiles || [];
    const files = await fs.readdir(dir);

    await Promise.all(
        files.map(async (file) => {
            const name = pathJoin(dir, file);

            const isDirectory = (await fs.stat(name)).isDirectory();

            allFiles.push(name);

            if (isDirectory) {
                await getFilePathsRecursively(name, allFiles);
            }
        })
    );

    return allFiles;
}
