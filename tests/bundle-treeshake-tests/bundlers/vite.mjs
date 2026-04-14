import { basename, dirname } from 'node:path';
import { build } from 'vite';

export async function bundleWithVite({ entry, outFile }) {
    await build({
        configFile: false,
        logLevel: 'error',
        build: {
            lib: {
                entry,
                formats: ['es'],
                fileName: () => basename(outFile),
            },
            outDir: dirname(outFile),
            emptyOutDir: false,
            minify: 'esbuild',
            rollupOptions: {
                output: {
                    entryFileNames: basename(outFile),
                },
            },
        },
    });
}
