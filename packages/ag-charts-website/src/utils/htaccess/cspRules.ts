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
 * Keep this module free of Astro/Vite imports so it can be imported by a standalone
 * `tsx` script without pulling in the build graph (Node built-ins and plain-string
 * constants are fine — it is only ever imported build-side, never client-side).
 */
import { createHash } from 'node:crypto';

import { DARK_MODE_INIT_SCRIPT, KBD_PLATFORM_INIT_SCRIPT, PLAUSIBLE_INIT_SCRIPT } from '../csp/inlineScripts';

export type CspEnv = 'dev' | 'staging' | 'production';
export type CspMode = 'report-only' | 'enforce';

/**
 * 'site' is the default policy for ordinary pages. 'examples' additionally
 * allows 'unsafe-eval' and applies only to the example-runner documents — see
 * EXAMPLES_PATH_CONDITION.
 */
export type CspScope = 'site' | 'examples';

export interface CspOptions {
    env: CspEnv;
    /** Which policy variant to build. Defaults to 'site'. */
    scope?: CspScope;
    /** Override the trial-licence form origin. Defaults to the per-env value. */
    trialFormOrigin?: string;
}

/** Ordered map of directive name to its allowed sources. */
export type CspDirectives = Record<string, string[]>;

const SELF = "'self'";
const NONE = "'none'";
// In script-src, 'unsafe-inline' is now scope-specific: the 'site' policy
// authorises its few known inline scripts by SHA-256 hash instead (see
// SITE_SCRIPT_HASHES), while 'examples' still carries it. In style-src it stays
// everywhere (charts theming/legacy styles inject <style> at runtime).
const UNSAFE_INLINE = "'unsafe-inline'";
// Permits WebAssembly compilation without permitting JS eval() — narrower than
// 'unsafe-eval'. Needed on every page: docs snippets are highlighted in the
// browser by Shiki, whose oniguruma engine instantiates a WASM module
// (see CodeShiki.tsx). Browsers that predate this token fall back to requiring
// 'unsafe-eval' for WASM.
const WASM_UNSAFE_EVAL = "'wasm-unsafe-eval'";
// Allowed only in the 'examples' scope: the example-runner documents load modules
// with legacy SystemJS (fetches source over XHR and evals it) and the Angular
// examples compile templates in the browser (JIT). The chart library itself does
// not need it (see AG-11258), so ordinary pages no longer carry it.
const UNSAFE_EVAL = "'unsafe-eval'";

// SHA-256 hashes authorising the main-page inline <script>s in the 'site' scope
// instead of 'unsafe-inline'. Derived from the SAME constants the pages render
// (src/utils/csp/inlineScripts.ts) so the policy can never drift from what is
// served — edit the script and the hash follows automatically. Added ONLY to the
// 'site' scope: per CSP2+, the presence of a hash makes the browser ignore
// 'unsafe-inline', so the 'examples' scope — which still relies on it — must NOT
// carry them. Dev keeps 'unsafe-inline' (Vite/Astro inject their own inline scripts).
// The homepage gallery script is externalised (not hashed) — it embeds build-hashed
// CSS-module class names, which would make a static hash unstable.
//
// NB: this hashes the source string; the browser hashes the rendered bytes. They
// match as long as Astro emits the inline script verbatim (verified in dev; the
// production report-only window is the backstop before enforcing).
const hashInlineScript = (source: string): string =>
    `'sha256-${createHash('sha256').update(source, 'utf8').digest('base64')}'`;

// Astro injects a small, fixed set of inline hydration-runtime scripts that we
// cannot externalise — they are emitted (and minified) by the framework, not
// authored here. Every OTHER site inline script is externalised to a 'self' bundle
// (the GTM bootstrap; the homepage gallery; FrameworkRedirectPage), so these are the
// only inline scripts the 'site' scope authorises by hash.
//
// Because the rendered bytes are Astro's build-time output, there is no source
// string to derive these from — they are pinned, and they change when Astro's
// hydration runtime changes, i.e. on an Astro upgrade. ASTRO_HYDRATION_HASHES_VERIFIED_FOR
// records the Astro version they were captured against; cspRules.test.ts fails when
// the installed version no longer matches, so an upgrade cannot silently leave the
// policy stale (which would block hydration site-wide — staging enforces this scope).
//
// === HOW TO REGENERATE AFTER AN ASTRO UPGRADE ===
//   1. yarn nx build ag-charts-website
//   2. yarn nx run ag-charts-website:preview:csp          (serves the build with the enforced policy)
//   3. Open https://localhost:4601/ plus a page using each client: directive
//      (load/idle/only/visible) and read the browser console: every blocked inline
//      script logs the missing 'sha256-...' value in its CSP violation. (Equivalently,
//      hash the inline <script> contents in dist and diff against the list below.)
//   4. Replace the hashes below with the new values, and bump
//      ASTRO_HYDRATION_HASHES_VERIFIED_FOR to the new Astro version.
export const ASTRO_HYDRATION_HASHES_VERIFIED_FOR = '6.1.9';
const ASTRO_HYDRATION_SCRIPT_HASHES = [
    "'sha256-QzWFZi+FLIx23tnm9SBU4aEgx4x8DsuASP07mfqol/c='", // client:load bootstrap
    "'sha256-eIXWvAmxkr251LJZkjniEK5LcPF3NkapbJepohwYRIc='", // client:only bootstrap
    "'sha256-Q2BPg90ZMplYY+FSdApNErhpWafg2hcRRbndmvxuL/Q='", // client:visible bootstrap
    "'sha256-BF0290pkb3jxQsE7z00xR8Imp8X34FLC88L0lkMnrGw='", // client:idle bootstrap
    "'sha256-BrDhGE1lwa85arfXcrBxSo+n37uVSX5CAROXnIM6Q+g='", // <astro-island> hydration runtime
];

// SHA-256 of the inline ZoomInfo (WebSights) bootstrap that the shared Google Tag
// Manager container injects as a Custom HTML tag once the visitor accepts functional
// cookie consent. Unlike the scripts above, this one is authored in GTM, not this
// repo — so the value is taken from the browser's CSP violation report, NOT by
// hashing the GTM source (GTM normalises the injected bytes, so the source does not
// reproduce this digest).
//
// FRAGILE — this pins ZoomInfo's exact bytes. If the ZoomInfo tag in GTM is edited,
// or ZoomInfo regenerates its loader snippet, the hash stops matching and ZoomInfo
// silently fails to load for consenting users. The GTM tag carries a note pointing
// back here; if it changes, replace this with the new console-reported hash (here and
// in the ag-grid / ag-studio CSPs — the GTM container is shared). AG-17134.
const GTM_ZOOMINFO_HASH = "'sha256-41l+jvtOjBgKy9345IStB4j1gGPGFMVXADMHn1Acs6E='";

const SITE_SCRIPT_HASHES = [
    hashInlineScript(DARK_MODE_INIT_SCRIPT),
    hashInlineScript(PLAUSIBLE_INIT_SCRIPT),
    hashInlineScript(KBD_PLATFORM_INIT_SCRIPT),
    ...ASTRO_HYDRATION_SCRIPT_HASHES,
    GTM_ZOOMINFO_HASH,
];

// Apache <If> expression matching the URL paths that get the 'examples' scope.
// Charts serves example-runner documents at both /gallery/examples/<name>/... and
// /<framework>/<page>/examples/<name>/..., and the whole site sits under /charts in
// production, so '/examples/' is not a leading prefix — match the segment anywhere.
// '/archive/' covers archived doc versions (which ship the same runner).
export const EXAMPLES_PATH_CONDITION = '%{REQUEST_URI} =~ m#/(examples|archive)/#';

// JS equivalent of EXAMPLES_PATH_CONDITION above, for the dev-server (agDevCsp) and
// preview-server (preview-csp) middleware that scope the served CSP by URL path.
// No leading anchor: the site is served under the /charts base, so '/examples/' is
// not a leading prefix. Keep in sync with EXAMPLES_PATH_CONDITION.
export const EXAMPLES_PATH_REGEXP = /\/(examples|archive)\//;

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

// The license-pricing form also does a native POST to Salesforce Web-to-Lead — a
// sandbox org in non-prod, the live org in production (see CONTACT_FORM_DATA in
// external/ag-website-shared/src/constants.ts). Governed by form-action, not connect-src.
const SALESFORCE_FORM_ORIGIN: Record<CspEnv, string> = {
    dev: 'https://test.salesforce.com',
    staging: 'https://test.salesforce.com',
    production: 'https://webto.salesforce.com',
};

// Dev-server-only extras (HMR + cross-port preview). Never emitted for staging or
// production. Charts dev server runs on 4600/4601 (see astro.config.mjs).
const DEV_SCRIPT_SRC = ['https://localhost:4600', 'https://localhost:4601'];
const DEV_CONNECT_SRC = ['https://localhost:4600', 'https://localhost:4601', 'ws://localhost:*', 'wss://localhost:*'];

export function getCspDirectives(options: CspOptions): CspDirectives {
    const { env } = options;
    const scope = options.scope ?? 'site';
    const trialFormOrigin = options.trialFormOrigin ?? TRIAL_FORM_ORIGIN[env];
    const salesforceFormOrigin = SALESFORCE_FORM_ORIGIN[env];

    const directives: CspDirectives = {
        'default-src': [SELF],
        'script-src': [
            SELF,
            AG_GRID_HOSTS,
            'https://plausible.io',
            'https://www.googletagmanager.com',
            'https://www.google-analytics.com', // Universal Analytics analytics.js (GTM-injected after cookie consent)
            'https://cdn.jsdelivr.net',
            'https://js.zi-scripts.com', // ZoomInfo tag (injected via GTM)
            'https://*.zoominfo.com', // ZoomInfo FormComplete (trial form)
            'https://www.google.com', // reCAPTCHA (license-pricing trial form)
            'https://www.gstatic.com', // reCAPTCHA
            'https://www.youtube.com', // YouTube iframe JS API (loads into the page)
            'https://cdn.cookielaw.org', // OneTrust cookie-consent SDK (GTM-injected, prod-only)
            'blob:', // ZoomInfo zi-tag.js bootstraps a blob: URL script
            WASM_UNSAFE_EVAL,
            // 'unsafe-inline' (examples/dev) or SHA-256 hashes (site) added per scope below.
        ],
        // 'unsafe-inline' stays: the charts theming/legacy styles inject <style>
        // elements at runtime and static hosting rules out per-request nonces.
        // cdnjs.cloudflare.com: the font-icons docs example loads the Font Awesome stylesheet
        // (and its woff2 fonts) from there at runtime.
        'style-src': [
            SELF,
            'https://fonts.googleapis.com',
            'https://cdn.jsdelivr.net',
            'https://cdnjs.cloudflare.com',
            UNSAFE_INLINE,
        ],
        'font-src': [
            SELF,
            'https://fonts.gstatic.com',
            'https://cdn.jsdelivr.net',
            'https://cdnjs.cloudflare.com',
            'data:',
        ],
        // Relaxed to https:. Images/media are open-ended (blog/showcase images, chart
        // example assets) and a weak XSS vector — the strict script/connect/frame-src
        // below carry the protection.
        'img-src': [SELF, 'data:', 'blob:', 'https:'],
        // NOTE: chart examples (maps, live data) fetch from many external hosts. These
        // will surface as report-only violations during the validation window and need
        // a decision (broaden vs allowlist) before flipping to enforce.
        'connect-src': [
            SELF,
            'data:', // sized SVG/data-URI images are fetched for resize injection (see imageLoader.ts)
            AG_GRID_HOSTS,
            'https://plausible.io',
            'https://*.algolia.net', // Algolia DocSearch
            'https://*.algolianet.com', // Algolia DocSearch
            'https://*.google-analytics.com', // GA4 incl. regional collect endpoints (region1/2.google-analytics.com)
            'https://*.analytics.google.com',
            'https://stats.g.doubleclick.net',
            'https://www.googletagmanager.com',
            'https://cdn.jsdelivr.net', // example-runner SystemJS fetches modules as text (XHR)
            'https://js.zi-scripts.com', // ZoomInfo
            'https://*.zoominfo.com', // ZoomInfo
            'https://www.google.com', // reCAPTCHA (api2/clr XHR)
            'https://cdn.cookielaw.org', // OneTrust config/JSON/asset XHR (GTM-injected, prod-only)
            'https://*.onetrust.com', // OneTrust geolocation + consent-receipt endpoints
            trialFormOrigin, // trial-licence form fetch POST
        ],
        'frame-src': [
            SELF,
            // Chart PNG export clicks an <a download href="data:image/png;…">. Firefox routes that
            // data: load through frame-src and blocks the download (Moz bug 1194734); Chromium honours
            // the download attribute and never checks frame-src. img-src/media-src already allow data:.
            'data:',
            'https://www.googletagmanager.com',
            'https://www.youtube.com',
            'https://www.google.com', // reCAPTCHA challenge iframe
        ],
        'media-src': [SELF, 'data:', 'blob:', 'https:'],
        'worker-src': [SELF, 'blob:'],
        'object-src': [NONE],
        'base-uri': [SELF],
        'form-action': [
            SELF,
            trialFormOrigin,
            salesforceFormOrigin,
            'https://codesandbox.io', // example-runner "Open in CodeSandbox" form POST
            'https://plnkr.co', // example-runner "Open in Plunker" form POST
        ],
        'frame-ancestors': [SELF, AG_GRID_HOSTS], // allow *.ag-grid.com (e.g. blog) to embed examples
    };

    // script-src inline handling, by scope (and environment for 'site').
    if (scope === 'examples') {
        directives['script-src'].push(UNSAFE_EVAL, UNSAFE_INLINE);
    } else if (env === 'dev') {
        // Dev server (Vite/Astro) injects its own inline scripts for HMR/hydration
        // that the static build does not; keep 'unsafe-inline' locally rather than
        // block them. The hash-based site policy is validated on staging/production.
        directives['script-src'].push(UNSAFE_INLINE);
    } else {
        // 'site' on staging/production: authorise the known inline scripts by hash.
        directives['script-src'].push(...SITE_SCRIPT_HASHES);
    }

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
    const lines: string[] = ['# Override the CSP inherited from the grid root for /charts pages.'];
    // Always replace the inherited report-only header so grid's report-only policy does
    // not also report against /charts. Only unset the inherited *enforced* CSP when this
    // block enforces — during the report-only window keep it for baseline protection
    // rather than leaving /charts with no enforced CSP.
    if (mode === 'enforce') {
        lines.push('Header always unset Content-Security-Policy');
    }
    lines.push('Header always unset Content-Security-Policy-Report-Only');
    lines.push(getCspHtaccessLine(options, mode));
    return lines.join('\n');
}

/**
 * Build the full `.htaccess` CSP block with the path-scoped policy split: the
 * 'site' policy (no 'unsafe-eval') for ordinary pages, replaced by the
 * 'examples' policy for the paths matched by EXAMPLES_PATH_CONDITION.
 *
 * A second CSP policy can only tighten (browsers enforce the intersection), so
 * the relaxation must unset and re-set the header rather than add another one.
 */
export function getScopedCspHtaccessBlock(options: Omit<CspOptions, 'scope'>, mode: CspMode): string {
    const headerName = getCspHeaderName(mode);
    return [
        getCspHtaccessBlock({ ...options, scope: 'site' }, mode),
        '',
        "# Example-runner documents and archived doc versions additionally need 'unsafe-eval'",
        '# (SystemJS eval-loads modules; the Angular JIT compiler also compiles in the browser).',
        '# <If> sections merge after all other configuration, so this unset+set replaces the',
        '# header set above for matching requests.',
        `<If "${EXAMPLES_PATH_CONDITION}">`,
        `    Header always unset ${headerName}`,
        `    ${getCspHtaccessLine({ ...options, scope: 'examples' }, mode)}`,
        '</If>',
    ].join('\n');
}
