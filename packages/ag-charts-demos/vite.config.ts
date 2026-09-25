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
    oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
    server: { port: 4700, host: true },
    preview: { port: 4700, host: true },
});
