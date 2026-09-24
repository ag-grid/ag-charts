#!/usr/bin/env tsx
/* eslint-disable no-console */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { MANIFEST_FILENAME, buildPrPreviewPlan } from '../src/utils/prPreviewManifest';

/**
 * Stages the per-PR preview payload and writes its `manifest.json`.
 *
 * The file list is derived from the site's own import-map builder (see
 * `src/utils/prPreviewManifest.ts`), not hand-maintained, so the preview always carries exactly
 * the files an exported Plunker's import map asks for. Design: ag-dev-prompts
 * docs/pr-plnkr-v2-plan.md.
 *
 * Usage:
 *   tsx scripts/pr-preview-manifest.ts --pr 8231 --sha 0123abcd --out ../../dist/pr-preview
 *
 *   --pr <n>        PR number (required)
 *   --sha <sha>     head commit of the preview (required)
 *   --out <dir>     staging directory; emptied first (required)
 *   --repo <o/r>    owner/repo, default $GITHUB_REPOSITORY or ag-grid/ag-charts
 *   --allow-missing local dry-run only: report missing sources instead of failing
 */

// From this file's own URL rather than `import.meta.dirname`, which tsx leaves undefined when it
// transpiles to CommonJS, and rather than the cwd, which the caller chooses.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const parseArgs = (argv: string[]) => {
    const flags = new Map<string, string>();
    let allowMissing = false;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--allow-missing') {
            allowMissing = true;
        } else if (arg.startsWith('--')) {
            const value = argv[i + 1];
            if (value === undefined || value.startsWith('--')) {
                throw new Error(`Missing value for ${arg}`);
            }
            flags.set(arg.slice(2), value);
            i++;
        } else {
            throw new Error(`Unexpected argument '${arg}'`);
        }
    }
    const required = (name: string) => {
        const value = flags.get(name);
        if (!value) {
            throw new Error(`--${name} is required`);
        }
        return value;
    };
    const pr = Number(required('pr'));
    if (!Number.isInteger(pr) || pr <= 0) {
        throw new Error(`--pr must be a positive integer, got '${flags.get('pr')}'`);
    }
    return {
        pr,
        sha: required('sha'),
        out: resolve(process.cwd(), required('out')),
        repo: flags.get('repo') ?? process.env.GITHUB_REPOSITORY ?? 'ag-grid/ag-charts',
        allowMissing,
    };
};

/**
 * The version a package would publish as. Read from the package rather than the site's
 * `PUBLIC_PACKAGE_VERSION`, which an Astro build supplies and a plain script run does not.
 */
const versionOf = (packageName: string): string => {
    const path = join(REPO_ROOT, 'packages', packageName, 'package.json');
    const { version } = JSON.parse(readFileSync(path, 'utf8'));
    if (typeof version !== 'string' || version.length === 0) {
        throw new Error(`${path} declares no version.`);
    }
    return version;
};

const main = () => {
    const { pr, sha, out, repo, allowMissing } = parseArgs(process.argv.slice(2));
    let plan = buildPrPreviewPlan({ repo, pr, sha, versionOf });

    const missing = plan.entries.filter(({ source }) => !existsSync(join(REPO_ROOT, source)));

    // Fail loud by default: a preview that silently omits a package publishes a manifest promising
    // files that 404, and the pin that reads it produces a broken repro rather than no repro.
    if (missing.length > 0) {
        const detail = missing.map(({ target, source }) => `  - ${target} <- ${source}`).join('\n');
        if (!allowMissing) {
            console.error(`PR preview: ${missing.length} manifest path(s) are not built:\n${detail}`);
            console.error('Build the packages the manifest names, or pass --allow-missing for a dry run.');
            process.exit(1);
        }
        console.warn(`PR preview: ignoring ${missing.length} unbuilt path(s) (--allow-missing):\n${detail}`);
        const unbuilt = new Set(missing.map(({ target }) => target));
        plan = { manifest: plan.manifest, entries: plan.entries.filter(({ target }) => !unbuilt.has(target)) };
    }

    rmSync(out, { recursive: true, force: true });
    mkdirSync(out, { recursive: true });
    for (const { target, source } of plan.entries) {
        const destination = join(out, target);
        mkdirSync(dirname(destination), { recursive: true });
        cpSync(join(REPO_ROOT, source), destination);
    }
    writeFileSync(join(out, MANIFEST_FILENAME), `${JSON.stringify(plan.manifest, null, 2)}\n`);

    const bytes = plan.entries.reduce((total, { source }) => total + statSync(join(REPO_ROOT, source)).size, 0);
    console.log(
        `PR preview: staged ${plan.entries.length} file(s), ${(bytes / 1024 / 1024).toFixed(1)} MB, ` +
            `${Object.keys(plan.manifest.packages).length} package(s) into ${out}`
    );
};

try {
    main();
} catch (error) {
    console.error(`PR preview: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
}
