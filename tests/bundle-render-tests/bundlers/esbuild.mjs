import esbuild from 'esbuild';

export async function bundleWithEsbuild({ entry, outFile }) {
    await esbuild.build({
        entryPoints: [entry],
        bundle: true,
        minify: true,
        format: 'esm',
        outfile: outFile,
        platform: 'browser',
        target: 'es2020',
        treeShaking: true,
        logLevel: 'error',
    });
}
