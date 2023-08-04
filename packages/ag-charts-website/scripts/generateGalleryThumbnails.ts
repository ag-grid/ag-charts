import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import {
    getGalleryData,
    getGalleryExamples,
    getPlainThumbnailFileUrl,
    getPlainThumbnailFolderUrl,
} from '../src/features/gallery/utils/filesData';
import { getThumbnail } from '../src/features/gallery/utils/getThumbnail';

const DEV_SERVER_CMD = `nx dev ag-charts-website`;

/**
 * Root path of monorepo, relative to this file
 */
const ROOT_PATH = '../../../';

let server: ChildProcessWithoutNullStreams;

async function generateGalleryThumbnails({ baseUrl }: { baseUrl: string }) {
    const isDev = true;
    const galleryData = getGalleryData({ isDev });
    const galleryExamples = getGalleryExamples({ galleryData });
    const thumbnailFolder = getPlainThumbnailFolderUrl({ isDev });

    if (!existsSync(thumbnailFolder)) {
        mkdirSync(thumbnailFolder, { recursive: true });
    }

    const generateGalleryExamplesPromises = galleryExamples.map(async ({ exampleName }) => {
        const imageFilePath = getPlainThumbnailFileUrl({ exampleName, isDev });
        const imageBuffer = await getThumbnail({ exampleName, baseUrl });
        writeFileSync(imageFilePath, imageBuffer);
    });

    await Promise.all(generateGalleryExamplesPromises);
}

function startPreviewServer(): Promise<{ baseUrl: string; server: ChildProcessWithoutNullStreams }> {
    const previewServerRegex = /Local\s*(http.*)$/gm;
    const [program, ...args] = DEV_SERVER_CMD.split(' ');

    return new Promise((resolve, reject) => {
        const cwd = new URL(ROOT_PATH, import.meta.url).pathname;
        server = spawn(program, args, {
            cwd,
        });

        server.stdout.setEncoding('utf-8');
        server.stdout.on('data', function (data) {
            // Strip ANSI escape characters
            const cleanedData = data.replace(
                // eslint-disable-next-line no-control-regex
                /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
                ''
            );
            const [_, baseUrl] = previewServerRegex.exec(cleanedData) || [];

            if (baseUrl) {
                resolve({ server, baseUrl });
            }
        });

        server.stderr.setEncoding('utf8');
        server.stderr.on('data', function (data) {
            reject(data);
        });
    });
}

function cleanUp() {
    if (server) {
        server.kill();
    }
}

async function main() {
    const { baseUrl } = await startPreviewServer();
    // eslint-disable-next-line no-console
    console.log(`Dev server started: ${baseUrl}`);

    await generateGalleryThumbnails({ baseUrl });

    // eslint-disable-next-line no-console
    console.log(`Generated all gallery thumbnails`);

    cleanUp();

    // Make sure it shuts down completely
    process.exit();
}

main();

// Capture ctrl-c
process.on('SIGINT', () => {
    cleanUp();
    process.exit();
});

process
    .on('unhandledRejection', (reason, p) => {
        cleanUp();
        // eslint-disable-next-line no-console
        console.error(reason, 'Unhandled Rejection', p);
        process.exit(1);
    })
    .on('uncaughtException', (err) => {
        cleanUp();
        // eslint-disable-next-line no-console
        console.error(err, 'Uncaught Exception', err);
        process.exit(1);
    });
