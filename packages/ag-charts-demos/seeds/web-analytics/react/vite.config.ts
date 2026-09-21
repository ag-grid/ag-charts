import { defineConfig } from 'vite';

export default defineConfig({
    // JSX is handled by Vite's built-in esbuild transform (automatic runtime), so
    // @vitejs/plugin-react is not needed for this demo.
    esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
});
