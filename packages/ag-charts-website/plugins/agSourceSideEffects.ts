import type { Plugin } from 'vite';

const SIDE_EFFECT_ENTRY = /packages\/ag-charts-enterprise\/src\/main\.ts$/;

/*
 * The enterprise `sideEffects` field only covers the shipped `dist` bundles, so the aliased source
 * entry would otherwise lose its top-level registry setup to tree-shaking in production builds.
 */
export default function agSourceSideEffects(): Plugin {
    return {
        name: 'ag-source-side-effects',
        transform(_code, id) {
            return SIDE_EFFECT_ENTRY.test(id) ? { moduleSideEffects: true } : null;
        },
    };
}
