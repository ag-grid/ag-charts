import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';

import { publishNpmPackageTarballs } from '../src/utils/publishNpmPackages';

type Options = {
    /** Whether this build deploys, and so serves the tarballs. Off for dev and PR builds, which skip the copy (the cached `pack` tasks still run). */
    enabled: boolean;
};

// Where each package's `pack` target writes its tarball: `<repo>/dist/packages/<name>.tgz`.
const PACKED_TARBALLS_DIR = fileURLToPath(new URL('../../../dist/packages/', import.meta.url));

/**
 * Publishes the AG Charts package tarballs at `<site base>/npm-packages/<name>.tgz`, built from the
 * same commit as the site. Needs the website `build` target's `pack` dependencies to have run.
 */
export default function createPlugin({ enabled }: Options): AstroIntegration {
    return {
        name: 'ag-npm-packages',
        hooks: {
            'astro:build:done': async ({ dir }) => {
                if (!enabled) {
                    // eslint-disable-next-line no-console
                    console.info('[agNpmPackages] PUBLISH_NPM_PACKAGES not set, skipping');
                    return;
                }
                const published = await publishNpmPackageTarballs({
                    sourceDir: PACKED_TARBALLS_DIR,
                    outDir: fileURLToPath(dir),
                });
                // eslint-disable-next-line no-console
                console.info(`[agNpmPackages] published ${published.length} package tarballs`);
            },
        },
    };
}
