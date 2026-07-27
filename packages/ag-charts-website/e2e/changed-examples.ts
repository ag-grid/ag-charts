import { execSync } from 'child_process';

/**
 * Changed-example detection, shared by the test-file generator and the runtime example sweeps.
 *
 * `NX_BASE` names the base ref to diff against. Without it no diff is computable, so callers treat
 * every example as changed — the safe side for both the `affected` flag and framework scoping.
 */

/** Every file belonging to an example lives under its `_examples/<example>/` directory. */
const EXAMPLE_DIR_PATTERN = /^(.*\/_examples\/[^/]+\/)/;

export interface ChangedExamples {
    /** The example generator plugin changed, which invalidates the output of every example. */
    all: boolean;
    /** Example directories (as returned by `exampleDir`) holding at least one changed file. */
    dirs: Set<string>;
}

/** The `_examples/<example>/` directory owning `path`, or undefined if it is not an example file. */
export function exampleDir(path: string): string | undefined {
    return EXAMPLE_DIR_PATTERN.exec(path)?.[1];
}

/**
 * Examples with any file changed relative to `NX_BASE`, or undefined when `NX_BASE` is unset.
 *
 * The whole example directory is matched rather than just `main.ts`, so an edit to `data.ts`, a
 * framework-specific template, or any other file in the example counts as a change.
 */
export function getChangedExamples(): ChangedExamples | undefined {
    const base = process.env.NX_BASE;
    if (!base) return undefined;

    const all = gitChangedFiles(base, '../../plugins/ag-charts-generate-example-files/').length > 0;

    const dirs = new Set<string>();
    for (const file of gitChangedFiles(base, './src/content/')) {
        // Diff output is workspace-relative, whereas examples are globbed relative to this package.
        const dir = exampleDir(file.replace(/^packages\/ag-charts-website\//, './'));
        if (dir != null) {
            dirs.add(dir);
        }
    }

    return { all, dirs };
}

export function isExampleChanged(changed: ChangedExamples, path: string): boolean {
    if (changed.all) return true;
    const dir = exampleDir(path);
    return dir != null && changed.dirs.has(dir);
}

function gitChangedFiles(base: string, pathspec: string): string[] {
    return execSync(`git diff --name-only ${base} -- ${pathspec}`)
        .toString()
        .split('\n')
        .filter((file) => file.trim().length > 0);
}
