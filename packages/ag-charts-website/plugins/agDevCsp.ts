import type { Plugin, ViteDevServer } from 'vite';

import { getCspValue } from '../src/utils/htaccess/cspRules';

const SITE_CSP = getCspValue({ env: 'dev', scope: 'site' });
const EXAMPLES_CSP = getCspValue({ env: 'dev', scope: 'examples' });

// Mirrors EXAMPLES_PATH_CONDITION in cspRules.ts: match the /examples/ or
// /archive/ segment anywhere (charts serves example-runner documents under both
// /gallery/examples/... and /<framework>/<page>/examples/..., under the /charts base).
const EXAMPLES_PATH = /\/(examples|archive)\//;

/**
 * Vite plugin serving the dev server's Content-Security-Policy header with the
 * same path-scoped split as the generated .htaccess: ordinary pages get the
 * 'site' policy (no 'unsafe-eval'), example-runner documents get the relaxed
 * 'examples' policy. Keeps local development honest about main-page eval use.
 */
export default function agDevCsp(): Plugin {
    return {
        name: 'ag-dev-csp',
        configureServer(server: ViteDevServer) {
            server.middlewares.use((req, res, next) => {
                const csp = EXAMPLES_PATH.test(req.url ?? '') ? EXAMPLES_CSP : SITE_CSP;
                res.setHeader('Content-Security-Policy', csp);
                next();
            });
        },
    };
}
