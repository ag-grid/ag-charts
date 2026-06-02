/**
 * Single source of truth for the AG Charts site's Content-Security-Policy.
 *
 * AG Charts is served from the /charts subdirectory of www.ag-grid.com, so its
 * pages inherit the grid root .htaccess CSP unless this policy overrides it (see
 * getCspHtaccessBlock — it unsets the inherited headers first). On charts-staging
 * the site is served at the root of its own host, so there is nothing to inherit
 * there; the override is harmless either way.
 *
 * Consumed by:
 *  - `scripts/csp/generate-csp.ts` to emit the policy for hand-placing / inspection.
 *  - `htaccessRules.ts` to emit the CSP block into the generated `.htaccess`.
 *
 * Keep this module dependency-free so it can be imported by a standalone `tsx`
 * script without pulling in the Astro/Vite build graph.
 */

export type CspEnv = 'dev' | 'staging' | 'production';
export type CspMode = 'report-only' | 'enforce';

export interface CspOptions {
    env: CspEnv;
    /** Override the trial-licence form origin. Defaults to the per-env value. */
    trialFormOrigin?: string;
}

/** Ordered map of directive name to its allowed sources. */
export type CspDirectives = Record<string, string[]>;

const SELF = "'self'";
const NONE = "'none'";
const UNSAFE_INLINE = "'unsafe-inline'";
// Required by the Angular example-runner (JIT compilation) and the charts
// example/theme tooling. Removing it is tracked separately.
const UNSAFE_EVAL = "'unsafe-eval'";

// 'self' resolves to www.ag-grid.com on production (charts lives under /charts) and
// charts-staging.ag-grid.com on staging, so cross-subdomain references to the
// production host need an explicit allowance. Harmless where 'self' already covers it.
const AG_GRID_HOSTS = 'https://*.ag-grid.com';

// The trial-licence form POSTs (via fetch) to a different Cloud Function per
// environment (see PUBLIC_TRIAL_LICENCE_FORM_URL in the .env.build.* files). Same
// origins as the grid site — the form is a shared ag-website-shared component.
const TRIAL_FORM_ORIGIN: Record<CspEnv, string> = {
    dev: 'https://us-central1-stripe-testing-19784.cloudfunctions.net',
    staging: 'https://us-central1-stripe-testing-19784.cloudfunctions.net',
    production: 'https://us-central1-aggrid-ecommerce.cloudfunctions.net',
};

// Dev-server-only extras (HMR + cross-port preview). Never emitted for staging or
// production. Charts dev server runs on 4600/4601 (see astro.config.mjs).
const DEV_SCRIPT_SRC = ['https://localhost:4600', 'https://localhost:4601'];
const DEV_CONNECT_SRC = ['https://localhost:4600', 'https://localhost:4601', 'ws://localhost:*', 'wss://localhost:*'];

export function getCspDirectives(options: CspOptions): CspDirectives {
    const { env } = options;
    const trialFormOrigin = options.trialFormOrigin ?? TRIAL_FORM_ORIGIN[env];

    const directives: CspDirectives = {
        'default-src': [SELF],
        'script-src': [
            SELF,
            AG_GRID_HOSTS,
            'https://plausible.io',
            'https://www.googletagmanager.com',
            'https://cdn.jsdelivr.net',
            'https://js.zi-scripts.com', // ZoomInfo tag (injected via GTM)
            'https://*.zoominfo.com', // ZoomInfo FormComplete (trial form)
            'https://www.youtube.com', // YouTube iframe JS API (loads into the page)
            UNSAFE_INLINE,
            UNSAFE_EVAL,
        ],
        'style-src': [SELF, 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net', UNSAFE_INLINE],
        'font-src': [SELF, 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net', 'data:'],
        // Relaxed to https:. Images/media are open-ended (blog/showcase images, chart
        // example assets) and a weak XSS vector — the strict script/connect/frame-src
        // below carry the protection.
        'img-src': [SELF, 'data:', 'blob:', 'https:'],
        // NOTE: chart examples (maps, live data) fetch from many external hosts. These
        // will surface as report-only violations during the validation window and need
        // a decision (broaden vs allowlist) before flipping to enforce.
        'connect-src': [
            SELF,
            AG_GRID_HOSTS,
            'https://plausible.io',
            'https://*.algolia.net', // Algolia DocSearch
            'https://*.algolianet.com', // Algolia DocSearch
            'https://www.google-analytics.com',
            'https://*.analytics.google.com',
            'https://stats.g.doubleclick.net',
            'https://www.googletagmanager.com',
            'https://cdn.jsdelivr.net', // example-runner SystemJS fetches modules as text (XHR)
            'https://js.zi-scripts.com', // ZoomInfo
            'https://*.zoominfo.com', // ZoomInfo
            trialFormOrigin, // trial-licence form fetch POST
        ],
        'frame-src': [SELF, 'https://www.googletagmanager.com', 'https://www.youtube.com'],
        'media-src': [SELF, 'data:', 'blob:', 'https:'],
        'worker-src': [SELF, 'blob:'],
        'object-src': [NONE],
        'base-uri': [SELF],
        'form-action': [SELF, trialFormOrigin],
        'frame-ancestors': [SELF],
    };

    if (env === 'dev') {
        directives['script-src'].push(...DEV_SCRIPT_SRC);
        directives['connect-src'].push(...DEV_CONNECT_SRC);
    }

    return directives;
}

/** Build the single-line CSP value (suitable for an HTTP header). */
export function getCspValue(options: CspOptions): string {
    const directives = getCspDirectives(options);
    const names = Object.keys(directives);
    const parts: string[] = [];
    for (let i = 0, len = names.length; i < len; ++i) {
        const name = names[i];
        parts.push(`${name} ${directives[name].join(' ')}`);
    }
    return parts.join('; ');
}

export function getCspHeaderName(mode: CspMode): string {
    return mode === 'enforce' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';
}

/** Build a single Apache `Header` directive line. */
export function getCspHtaccessLine(options: CspOptions, mode: CspMode): string {
    return `Header always set ${getCspHeaderName(mode)} "${getCspValue(options)}"`;
}

/**
 * Build the full `.htaccess` CSP block for a subdirectory deploy.
 *
 * Charts pages under /charts inherit the grid root .htaccess CSP. Unsetting both
 * header forms first guarantees charts pages are governed only by this policy,
 * regardless of which phase (report-only / enforce) the root policy is in.
 */
export function getCspHtaccessBlock(options: CspOptions, mode: CspMode): string {
    return [
        '# Clear any CSP inherited from the grid root .htaccess so /charts is governed',
        '# only by the charts policy below (per-product override).',
        'Header always unset Content-Security-Policy',
        'Header always unset Content-Security-Policy-Report-Only',
        getCspHtaccessLine(options, mode),
    ].join('\n');
}
