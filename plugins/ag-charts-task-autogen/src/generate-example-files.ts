import {
    type CreateDependencies,
    DependencyType,
    type RawProjectGraphDependency,
    type TargetConfiguration,
    validateDependency,
} from '@nx/devkit';
import { lstatSync, readdirSync, readlinkSync } from 'fs';
import { dirname, join, resolve } from 'path';

/**
 * Find symlinks in a directory and resolve them to workspace-relative paths.
 * Returns paths in the format suitable for Nx inputs (e.g., '{workspaceRoot}/path/to/file').
 */
function findSymlinkTargets(projectRoot: string): string[] {
    const symlinks: string[] = [];

    try {
        const files = readdirSync(projectRoot);
        for (const file of files) {
            const filePath = join(projectRoot, file);
            try {
                const stat = lstatSync(filePath);
                if (stat.isSymbolicLink()) {
                    // Read the symlink target (relative path like '../benchmarkUtils.ts')
                    const linkTarget = readlinkSync(filePath);
                    // Resolve relative to the symlink's directory to get workspace-relative path
                    const resolvedPath = join(dirname(filePath), linkTarget);
                    // Normalize the path (resolves '..' segments)
                    const normalizedPath = resolve(resolvedPath).replace(process.cwd() + '/', '');
                    symlinks.push(`{workspaceRoot}/${normalizedPath}`);
                }
            } catch {
                // Skip files we can't stat
            }
        }
    } catch {
        // Skip directories we can't read
    }

    return symlinks;
}

export function createTask(
    parentProject: string,
    srcRelativeInputPath: string,
    projectRoot: string
): Record<string, TargetConfiguration> {
    const baseInputs = ['{projectRoot}/**', '{workspaceRoot}/plugins/ag-charts-generate-example-files/{dist,src}/**/*'];

    // Add symlink targets as additional inputs
    const symlinkTargets = findSymlinkTargets(projectRoot);
    const inputs = [...baseInputs, ...symlinkTargets];

    return {
        'generate-example': {
            dependsOn: [{ projects: 'ag-charts-generate-example-files', target: 'build' }],
            executor: 'ag-charts-generate-example-files:generate',
            inputs,
            outputs: ['{options.outputPath}'],
            cache: true,
            options: {
                mode: 'dev',
                examplePath: '{projectRoot}',
                outputPath: `dist/generated-examples/${parentProject}/${srcRelativeInputPath}`,
            },
            configurations: {
                archive: {
                    mode: 'prod',
                },
                staging: {
                    mode: 'prod',
                },
                production: {
                    mode: 'prod',
                },
            },
        },
    };
}

export const createDependencies: CreateDependencies = (opts, ctx) => {
    const { projects } = ctx;

    const result: ReturnType<CreateDependencies> = [];
    for (const name of Object.keys(projects)) {
        const config = projects[name];
        if (!config.tags?.includes('type:generated-example')) continue;

        const parent = config.tags?.find((t) => t.startsWith('scope:'))?.split(':')[1];
        if (!parent) continue;

        const dependency: RawProjectGraphDependency = {
            source: `${parent}`,
            target: `${name}`,
            type: DependencyType.implicit,
        };
        validateDependency(dependency, ctx);
        result.push(dependency);
    }

    return result;
};
