import { type AstroIntegration } from 'astro';
import { getAllDocsExampleFileList } from '../../utils/pages';

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

                const exampleFiles = await getAllDocsExampleFileList();
                exampleFiles.forEach((exampleFile) => {
                    addWatchFile(exampleFile);
                });
            },
        },
    };
}
