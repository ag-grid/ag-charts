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

import {
    DARK_MODE_INIT_SCRIPT,
    KBD_PLATFORM_INIT_SCRIPT,
    PLAUSIBLE_INIT_SCRIPT,
    PLAUSIBLE_PAGE_LOAD_SCRIPT,
} from '../csp/inlineScripts';

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
// In script-src this is scope-specific ('examples' only; 'site' uses SITE_SCRIPT_HASHES);
// in style-src it applies everywhere, as charts theming injects <style> at runtime.
const UNSAFE_INLINE = "'unsafe-inline'";
// Narrower than 'unsafe-eval'; needed on every page because Shiki's oniguruma engine
// instantiates a WASM module to highlight docs snippets.
const WASM_UNSAFE_EVAL = "'wasm-unsafe-eval'";
// 'examples' scope only: Angular JIT, in-page TypeScript transpilation and archived
// versions' SystemJS all eval. The chart library itself does not need it.
const UNSAFE_EVAL = "'unsafe-eval'";

// Derived from the same constants the pages render, so the policy cannot drift from what is
// served. Must stay out of the 'examples' scope: per CSP2+ any hash makes the browser ignore
// the 'unsafe-inline' that scope still relies on.
const hashInlineScript = (source: string): string =>
    `'sha256-${createHash('sha256').update(source, 'utf8').digest('base64')}'`;

// Astro emits these inline, so there is no source string to derive them from — they are
// pinned, and an Astro upgrade changes them. To regenerate: build, serve via
// `preview:csp`, visit a page per client: directive and read the sha256 values out of the
// console's CSP violations, then bump ASTRO_HYDRATION_HASHES_VERIFIED_FOR.
export const ASTRO_HYDRATION_HASHES_VERIFIED_FOR = '6.1.9';
const ASTRO_HYDRATION_SCRIPT_HASHES = [
    "'sha256-QzWFZi+FLIx23tnm9SBU4aEgx4x8DsuASP07mfqol/c='", // client:load bootstrap
    "'sha256-eIXWvAmxkr251LJZkjniEK5LcPF3NkapbJepohwYRIc='", // client:only bootstrap
    "'sha256-Q2BPg90ZMplYY+FSdApNErhpWafg2hcRRbndmvxuL/Q='", // client:visible bootstrap
    "'sha256-BF0290pkb3jxQsE7z00xR8Imp8X34FLC88L0lkMnrGw='", // client:idle bootstrap
    "'sha256-BrDhGE1lwa85arfXcrBxSo+n37uVSX5CAROXnIM6Q+g='", // <astro-island> hydration runtime
];

// Each pins a third party's exact bytes, so editing the tag silently stops it running. A tag is
// only hashable while it interpolates no `{{…}}` macro, and re-deriving a digest means mirroring
// it into the ag-grid and ag-studio CSPs, whose GTM container is the same one.

// ZoomInfo (WebSights) bootstrap, injected once the visitor accepts functional cookie consent.
const GTM_ZOOMINFO_HASH = "'sha256-41l+jvtOjBgKy9345IStB4j1gGPGFMVXADMHn1Acs6E='";

// Hands the visitor's consent choice from the Enzuzo banner to GTM. A verbatim copy of
// Enzuzo's bytes, not a source of truth — the digest is what matters, and cspRules.test.ts
// pins the two together.
const ENZUZO_GTM_CONSENT_BRIDGE_SCRIPT = 'if (window.enzuzoGtmConsent) { window.enzuzoGtmConsent(); }';

// UTM attribution tags: a page-view capture and a form-submit POST to MAKE_WEBHOOK_HOST.
// Both avoid GTM macros, which is what keeps these digests pinnable.
const GTM_UTM_CAPTURE_HASH = "'sha256-nsp/0430/yfuSNjsteV2fUwjHINMowl9qldFKy6PKJs='";
const GTM_UTM_WEBHOOK_HASH = "'sha256-7f34QP24yF/YC+G6zSHRCBZrBez6xFf6GbcGIXkZ4K0='";

// An updated version of the GTM UTM-webhook tag above: the submit listener adds a third
// `true` argument to addEventListener, switching it to the capturing phase — otherwise
// byte-identical to GTM_UTM_WEBHOOK_HASH. Kept alongside it until the rollout is complete
// and the old hash is confirmed unused. AG-3390.
const GTM_UTM_WEBHOOK_CAPTURING_PHASE_HASH = "'sha256-1biJs72+znqmnYHTG0Ps3v04No9BtvG8+3CNYyK5djo='";

const SITE_SCRIPT_HASHES = [
    hashInlineScript(DARK_MODE_INIT_SCRIPT),
    hashInlineScript(PLAUSIBLE_INIT_SCRIPT),
    hashInlineScript(PLAUSIBLE_PAGE_LOAD_SCRIPT),
    hashInlineScript(KBD_PLATFORM_INIT_SCRIPT),
    ...ASTRO_HYDRATION_SCRIPT_HASHES,
    GTM_ZOOMINFO_HASH,
    hashInlineScript(ENZUZO_GTM_CONSENT_BRIDGE_SCRIPT),
    GTM_UTM_CAPTURE_HASH,
    GTM_UTM_WEBHOOK_HASH,
    GTM_UTM_WEBHOOK_CAPTURING_PHASE_HASH,
];

// Enzuzo cookie-consent banner, loaded by a tag in the shared GTM container, so the CSP is the
// only place the site declares these origins. Its `new Function` paths throw without
// 'unsafe-eval', which we will not grant site-wide, so keep the Enzuzo console configuration
// free of template placeholders and string-bodied event handlers.
// React and React DOM ship no ES module build on npm, so the example runner's import map
// resolves them through esm.sh.
const ESM_SH_HOST = 'https://esm.sh';

const ENZUZO_APP_HOST = 'https://app.enzuzo.com';
const ENZUZO_GVL_HOST = 'https://gvl.enzuzo.com';

// LinkedIn Insight Tag, loaded by a tag in the shared GTM container, so the CSP is the only
// place the site declares these origins. The rest of LinkedIn's published required-domains
// list is deliberately absent: neither SDK payload references those hosts, and the pixels
// they reach by redirect are already covered by the permissive img-src.
const LINKEDIN_SDK_HOST = 'https://snap.licdn.com';
const LINKEDIN_BEACON_HOST = 'https://px.ads.linkedin.com';

// Make webhook receiving UTM attribution, POSTed by the GTM tag behind GTM_UTM_WEBHOOK_HASH.
// The host is zone-specific, so it changes if the automation is recreated in another zone.
const MAKE_WEBHOOK_HOST = 'https://hook.eu2.make.com';

// Unanchored: the site sits under /charts and example runners appear at several depths, so
// the segment has to match anywhere.
export const EXAMPLES_PATH_CONDITION = '%{REQUEST_URI} =~ m#/(examples|archive)/#';

// Keep in sync with EXAMPLES_PATH_CONDITION; used by the dev- and preview-server middleware.
export const EXAMPLES_PATH_REGEXP = /\/(examples|archive)\//;

// 'self' is charts-staging.ag-grid.com on staging, so cross-subdomain references to the
// production host need an explicit allowance.
const AG_GRID_HOSTS = 'https://*.ag-grid.com';

// Must match PUBLIC_TRIAL_LICENCE_FORM_URL in the .env.build.* files.
const TRIAL_FORM_ORIGIN: Record<CspEnv, string> = {
    dev: 'https://us-central1-stripe-testing-19784.cloudfunctions.net',
    staging: 'https://us-central1-stripe-testing-19784.cloudfunctions.net',
    production: 'https://us-central1-aggrid-ecommerce.cloudfunctions.net',
};

// Salesforce Web-to-Lead target for the license-pricing form: a native POST, so this is
// governed by form-action rather than connect-src.
const SALESFORCE_FORM_ORIGIN: Record<CspEnv, string> = {
    dev: 'https://test.salesforce.com',
    staging: 'https://test.salesforce.com',
    production: 'https://webto.salesforce.com',
};

// Dev-server-only extras (HMR + cross-port preview); never emitted for staging or production.
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
            ESM_SH_HOST, // example-runner: React's ES module build (npm ships CJS only)
            'https://js.zi-scripts.com', // ZoomInfo tag (injected via GTM)
            'https://*.zoominfo.com', // ZoomInfo FormComplete (trial form)
            LINKEDIN_SDK_HOST, // LinkedIn Insight Tag SDK (injected via GTM)
            'https://www.google.com', // reCAPTCHA (license-pricing trial form)
            'https://www.gstatic.com', // reCAPTCHA
            'https://www.youtube.com', // YouTube iframe JS API (loads into the page)
            'https://cdn.cookielaw.org', // OneTrust cookie-consent SDK (GTM-injected, prod-only)
            ENZUZO_APP_HOST, // Enzuzo cookie-consent banner (GTM-injected), replacing OneTrust
            'blob:', // ZoomInfo zi-tag.js bootstraps a blob: URL script
            WASM_UNSAFE_EVAL,
            // 'unsafe-inline' (examples/dev) or SHA-256 hashes (site) added per scope below.
        ],
        // 'unsafe-inline' is unavoidable: charts theming injects <style> at runtime and
        // static hosting rules out per-request nonces.
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
        // Deliberately open: images are a weak XSS vector and the sources are open-ended.
        'img-src': [SELF, 'data:', 'blob:', 'https:'],
        'connect-src': [
            SELF,
            'data:', // sized SVG/data-URI images are fetched for resize injection (see imageLoader.ts)
            AG_GRID_HOSTS,
            'https://plausible.io',
            'https://*.algolia.net', // Algolia DocSearch
            'https://*.algolianet.com', // Algolia DocSearch
            'https://*.google-analytics.com', // GA4 incl. regional collect endpoints (region1/2.google-analytics.com)
            'https://*.analytics.google.com',
            'https://analytics.google.com', // GA4 apex collect endpoint (not matched by the *. wildcard)
            'https://stats.g.doubleclick.net',
            'https://www.googletagmanager.com',
            'https://cdn.jsdelivr.net', // example-runner: framework and library ES modules
            ESM_SH_HOST, // example-runner: React's ES module build
            'https://js.zi-scripts.com', // ZoomInfo
            'https://*.zoominfo.com', // ZoomInfo
            LINKEDIN_BEACON_HOST, // LinkedIn Insight Tag: website-actions beacon and attribution-trigger fetch
            'https://www.google.com', // reCAPTCHA (api2/clr XHR)
            'https://cdn.cookielaw.org', // OneTrust config/JSON/asset XHR (GTM-injected, prod-only)
            'https://*.onetrust.com', // OneTrust geolocation + consent-receipt endpoints
            ENZUZO_APP_HOST, // Enzuzo banner config, cookie list and consent-analytics XHR
            ENZUZO_GVL_HOST, // Enzuzo-hosted IAB TCF Global Vendor List
            MAKE_WEBHOOK_HOST, // UTM-attribution POST on form submit (injected via GTM)
            trialFormOrigin, // trial-licence form fetch POST
        ],
        'frame-src': [
            SELF,
            // Firefox routes an <a download href="data:…"> through frame-src and blocks the
            // chart PNG export without this (Moz bug 1194734).
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
            'https://ag-grid.us11.list-manage.com', // Beyond the Prompt "notify me" Mailchimp signup POST
        ],
        'frame-ancestors': [SELF, AG_GRID_HOSTS], // allow *.ag-grid.com (e.g. blog) to embed examples
    };

    // script-src inline handling, by scope (and environment for 'site').
    if (scope === 'examples') {
        directives['script-src'].push(UNSAFE_EVAL, UNSAFE_INLINE);
    } else if (env === 'dev') {
        // Vite/Astro inject their own inline scripts for HMR that the static build does not.
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
        '# (the Angular JIT compiler and the Plunker transpiler compile in the browser;',
        '# archived versions additionally eval-load modules with SystemJS).',
        '# <If> sections merge after all other configuration, so this unset+set replaces the',
        '# header set above for matching requests.',
        `<If "${EXAMPLES_PATH_CONDITION}">`,
        `    Header always unset ${headerName}`,
        `    ${getCspHtaccessLine({ ...options, scope: 'examples' }, mode)}`,
        '</If>',
    ].join('\n');
}
