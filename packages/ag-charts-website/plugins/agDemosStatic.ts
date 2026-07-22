import { fileURLToPath } from 'node:url';
import sirv from 'sirv';
import type { Plugin, ViteDevServer } from 'vite';

const DEMOS_DIST = fileURLToPath(new URL('../../ag-charts-demos/dist', import.meta.url));

/**
 * Dev-only: serve the built ag-charts-demos app from its dist folder under the
 * site base at `<base>/internal-demos`. Registered as an early connect middleware
 * so it resolves before Astro's page router (which would otherwise 404 the
 * request). `configureServer` never runs during a production build; in production
 * the demos are copied into the build output instead (see astro.config.mjs).
 *
 * The demos build is base-relative (DEMOS_BASE_PATH=./), so its assets resolve
 * relative to the entry module's URL under whatever base serves this mount — the
 * same demos route logic then works unchanged in dev, staging, and production.
 */
export default function agDemosStatic(basePath = '/'): Plugin {
    const mountPath = `${basePath.replace(/\/$/, '')}/internal-demos`;
    const serve = sirv(DEMOS_DIST, { dev: true, single: true, etag: true });

    return {
        name: 'ag-demos-static',
        configureServer(server: ViteDevServer) {
            server.middlewares.use((req, res, next) => {
                if (!req.url?.startsWith(mountPath)) {
                    return next();
                }
                // sirv resolves paths relative to the dist root, so strip the mount prefix.
                req.url = req.url.slice(mountPath.length) || '/';
                serve(req, res, next);
            });
        },
    };
}
