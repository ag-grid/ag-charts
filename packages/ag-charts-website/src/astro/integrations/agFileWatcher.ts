import type { AstroIntegration } from 'astro';
import { getAllExamplesFileList } from '../../features/docs/utils/filesData';

/**
 * Astro plugin to watch AG files, so dev server restarts when they are changed
 */
export default function createAgFileWatcherIntegration(): AstroIntegration {
    return {
        name: 'ag/file-watcher',
        hooks: {
            'astro:config:setup': async ({ command, addWatchFile }) => {
                if (command !== 'dev') {
                    return;
                }

                const exampleFiles = await getAllExamplesFileList();
                exampleFiles.forEach((exampleFile) => {
                    addWatchFile(exampleFile);
                });
            },
        },
    };
}
