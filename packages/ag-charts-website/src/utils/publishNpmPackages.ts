import { copyFile, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { NPM_PACKAGES_DIR, NPM_PACKAGE_NAMES } from './npmPackages';

/**
 * Copies the packed AG Charts tarballs into the site output at their fixed, versionless names
 * (`<outDir>/npm-packages/<name>.tgz`).
 *
 * `sourceDir` holds `<name>.tgz` for each package, which is where each package's `pack` target
 * writes it. Throws when one is missing rather than publishing a partial set: a seed pointing at
 * an absent tarball only fails once someone opens it.
 */
export async function publishNpmPackageTarballs({
    sourceDir,
    outDir,
}: {
    sourceDir: string;
    outDir: string;
}): Promise<string[]> {
    const targetDir = join(outDir, NPM_PACKAGES_DIR);
    await mkdir(targetDir, { recursive: true });

    const published: string[] = [];
    const missing: string[] = [];
    for (const name of NPM_PACKAGE_NAMES) {
        const source = join(sourceDir, `${name}.tgz`);
        if (
            !(await stat(source).then(
                (s) => s.isFile(),
                () => false
            ))
        ) {
            missing.push(source);
            continue;
        }
        const target = join(targetDir, `${name}.tgz`);
        await copyFile(source, target);
        published.push(target);
    }

    if (missing.length > 0) {
        throw new Error(
            `Cannot publish ${NPM_PACKAGES_DIR}/: missing packed tarball(s). Run the packages' "pack" targets first.\n` +
                missing.map((file) => `  ${file}`).join('\n')
        );
    }
    return published;
}
