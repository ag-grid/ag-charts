// Loads a product profile by slug. Used by run-ab-smoke.mjs, discover.mjs,
// and generate-report.mjs.

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { statSync } from 'node:fs';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROFILES = {
    'ag-charts': './profiles/ag-charts.mjs',
    'ag-grid': './profiles/ag-grid.mjs',
    'ag-studio': './profiles/ag-studio.mjs',
};

export async function loadProfile(product) {
    if (!product) {
        throw new Error(
            'product is required — set PRODUCT env var, sides.json "product" field, or --product flag'
        );
    }
    const path = PROFILES[product];
    if (!path) {
        throw new Error(`unknown product "${product}"; expected one of: ${Object.keys(PROFILES).join(', ')}`);
    }
    return import(resolve(__dirname, path));
}

export function resolveProduct({ sidesJson, envProduct, cliProduct }) {
    if (cliProduct) return cliProduct;
    if (envProduct) return envProduct;
    if (sidesJson?.product) return sidesJson.product;
    return autoDetectProduct();
}

function autoDetectProduct() {
    let remote;
    try {
        remote = execSync('git remote get-url origin 2>/dev/null', { encoding: 'utf8' }).trim();
    } catch {
        return null;
    }
    const repoName = remote.replace(/\.git$/, '').split('/').pop();
    if (repoName?.startsWith('ag-charts')) return 'ag-charts';
    if (repoName?.startsWith('ag-grid')) return 'ag-grid';
    if (repoName?.startsWith('ag-studio')) return 'ag-studio';

    for (const [product, profilePath] of Object.entries(PROFILES)) {
        const profile = profilePath; // lazy — probe fingerprint dirs instead
        const fingerprints = {
            'ag-charts': 'packages/ag-charts-website',
            'ag-grid': 'packages/ag-grid-docs',
            'ag-studio': 'packages/ag-studio-core',
        };
        try {
            statSync(resolve(process.cwd(), fingerprints[product]));
            return product;
        } catch {}
    }

    return null;
}
