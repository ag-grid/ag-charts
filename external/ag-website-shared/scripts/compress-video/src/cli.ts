import { join, parse } from 'path';

import { getContentFolder } from './utils/agFiles';
import { copyFiles, deleteFile, exists, fileSize, getFilePathsRecursively } from './utils/files';
import { getVideo, resizeVideo } from './utils/video';

const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.webm'];
const VIDEO_MAX_WIDTH = 1036;

async function main({ maxWidth, skipReplace, log }: { maxWidth: number; skipReplace?: boolean; log?: boolean }) {
    const contentFolder = getContentFolder();
    if (!contentFolder) {
        throw new Error('No content folder found');
    }

    const videoFiles = (await getFilePathsRecursively(contentFolder)).filter((path) => {
        const { ext } = parse(path);
        return VIDEO_EXTENSIONS.includes(ext);
    });

    videoFiles.map(async (source) => {
        const originalFileSize = await fileSize(source);
        const { video, metadata } = await getVideo({ source });
        if (metadata.width > maxWidth) {
            const { name, dir, ext } = parse(source);
            const destination = join(dir, `${name}-optimized${ext}`);

            if (await exists(destination)) {
                await deleteFile(destination);
            }

            const { fileSize } = await resizeVideo({
                video,
                width: maxWidth,
                frameRate: 30,
                destination,
            });

            if (!skipReplace) {
                await copyFiles(destination, source);
                await deleteFile(destination);
            }

            if (log) {
                console.log(
                    `Resized video: ${skipReplace ? destination : source} (${originalFileSize} -> ${fileSize})`
                );
            }
        }
    });
}

main({
    maxWidth: VIDEO_MAX_WIDTH,
    log: true,
});
