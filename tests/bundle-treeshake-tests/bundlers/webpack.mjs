import { basename, dirname } from 'node:path';
import webpack from 'webpack';

export async function bundleWithWebpack({ entry, outFile }) {
    return new Promise((resolve, reject) => {
        webpack(
            {
                mode: 'production',
                entry,
                output: {
                    path: dirname(outFile),
                    filename: basename(outFile),
                    library: { type: 'module' },
                },
                experiments: {
                    outputModule: true,
                },
                optimization: {
                    minimize: true,
                    usedExports: true,
                    sideEffects: true,
                },
                resolve: {
                    extensions: ['.mjs', '.js', '.json'],
                    conditionNames: ['import', 'module', 'default'],
                },
            },
            (err, stats) => {
                if (err) return reject(err);
                if (stats.hasErrors()) {
                    const errors = stats.compilation.errors.map((e) => e.message).join('\n');
                    return reject(new Error(errors));
                }
                resolve();
            }
        );
    });
}
