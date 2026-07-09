import { defineConfig } from 'vite';

export default defineConfig({
    // JSX is handled by Vite's built-in esbuild transform (automatic runtime).
    // @vitejs/plugin-react is intentionally not used: its version pulls a rollup
    // copy incompatible with the workspace's Vite 5, and Fast Refresh is not
    // needed for these demos.
    esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
    server: { port: 4700, host: true },
    preview: { port: 4700, host: true },
});
