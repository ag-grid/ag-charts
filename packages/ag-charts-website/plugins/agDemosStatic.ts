import { fileURLToPath } from 'node:url';
import sirv from 'sirv';
import type { Plugin, ViteDevServer } from 'vite';

// URL prefix (top-level, independent of the site's /charts base) under which the
// built ag-charts-demos app is served same-origin. The /debug/demos wrapper page
// iframes this path; keeping it same-origin means the site's frame-src 'self' CSP
// allows the embed with no cross-origin/mixed-content handling.
const MOUNT_PATH = '/internal-demos';

const DEMOS_DIST = fileURLToPath(new URL('../../ag-charts-demos/dist', import.meta.url));

/**
 * Dev-only: serve the built ag-charts-demos app from its dist folder at
 * MOUNT_PATH. Registered as an early connect middleware so it resolves before
 * Astro's page router (which would otherwise 404 the request). `configureServer`
 * never runs during a production build, so the demos stay off the live site.
 *
 * The demos must be built with base=MOUNT_PATH/ (see nx dev) so their absolute
 * asset URLs resolve under this mount.
 */
export default function agDemosStatic(): Plugin {
    const serve = sirv(DEMOS_DIST, { dev: true, single: true, etag: true });

    return {
        name: 'ag-demos-static',
        configureServer(server: ViteDevServer) {
            server.middlewares.use((req, res, next) => {
                if (!req.url?.startsWith(MOUNT_PATH)) {
                    return next();
                }
                // sirv resolves paths relative to the dist root, so strip the mount prefix.
                req.url = req.url.slice(MOUNT_PATH.length) || '/';
                serve(req, res, next);
            });
        },
    };
}
