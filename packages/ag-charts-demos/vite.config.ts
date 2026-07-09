import { defineConfig } from 'vite';

// Standalone (`vite`, the smoke E2E) serves from the root. When the website
// builds these demos for its dev server to serve statically, `nx dev` sets
// DEMOS_BASE_PATH so the built asset URLs resolve under the served sub-path.
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
