import { basename, dirname } from 'node:path';
import { build } from 'vite';

export async function bundleWithVite({ entry, outFile }) {
    await build({
        configFile: false,
        logLevel: 'error',
        build: {
            outDir: dirname(outFile),
            emptyOutDir: false,
            minify: 'esbuild',
            rollupOptions: {
                input: { main: entry },
                preserveEntrySignatures: 'strict',
                output: {
                    format: 'es',
                    entryFileNames: basename(outFile),
                },
            },
        },
    });
}
