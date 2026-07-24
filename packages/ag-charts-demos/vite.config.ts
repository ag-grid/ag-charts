import { defineConfig } from 'vite';

// Standalone (`vite` dev, the smoke E2E) serves from the root. The website
// consumes the built output under a deploy-dependent sub-path (which differs
// between staging and production), so builds set DEMOS_BASE_PATH=./ to emit a
// base-relative bundle whose chunks and assets resolve relative to the entry
// module's own URL — the serving side (the route + the dev static plugin)
// applies the actual base.
const base = process.env.DEMOS_BASE_PATH ?? '/';

export default defineConfig({
    base,
    // JSX is handled by Vite's built-in esbuild transform (automatic runtime).
    // @vitejs/plugin-react is intentionally not used: its version pulls a rollup
    // copy incompatible with the workspace's Vite 5, and Fast Refresh is not
    // needed for these demos.
    esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
    server: { port: 4700, host: true },
    preview: { port: 4700, host: true },
});
