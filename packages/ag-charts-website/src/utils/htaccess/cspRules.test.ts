import astroPackageJson from 'astro/package.json';
import { createHash } from 'node:crypto';

import {
    DARK_MODE_INIT_SCRIPT,
    KBD_PLATFORM_INIT_SCRIPT,
    PLAUSIBLE_INIT_SCRIPT,
    PLAUSIBLE_PAGE_LOAD_SCRIPT,
} from '../csp/inlineScripts';
import { ASTRO_HYDRATION_HASHES_VERIFIED_FOR, getCspDirectives, getScopedCspHtaccessBlock } from './cspRules';

const sha256Source = (source: string) => `'sha256-${createHash('sha256').update(source, 'utf8').digest('base64')}'`;
const hasHash = (sources: string[]) => sources.some((s) => s.startsWith("'sha256-"));

describe('cspRules', () => {
    describe('scope', () => {
        it("site scope omits 'unsafe-eval' from script-src", () => {
            expect(getCspDirectives({ env: 'production', scope: 'site' })['script-src']).not.toContain("'unsafe-eval'");
        });

        it("examples scope includes 'unsafe-eval' in script-src", () => {
            expect(getCspDirectives({ env: 'production', scope: 'examples' })['script-src']).toContain("'unsafe-eval'");
        });

        it('defaults to site scope', () => {
            expect(getCspDirectives({ env: 'production' })).toEqual(
                getCspDirectives({ env: 'production', scope: 'site' })
            );
        });

        it('site and examples scopes differ only in script-src', () => {
            const site = getCspDirectives({ env: 'production', scope: 'site' });
            const examples = getCspDirectives({ env: 'production', scope: 'examples' });
            const names = Object.keys(site).filter((name) => name !== 'script-src');
            expect(Object.keys(examples)).toEqual(Object.keys(site));
            for (let i = 0, len = names.length; i < len; ++i) {
                expect(examples[names[i]]).toEqual(site[names[i]]);
            }
        });

        it("both scopes include 'wasm-unsafe-eval' for browser-side Shiki highlighting", () => {
            expect(getCspDirectives({ env: 'production', scope: 'site' })['script-src']).toContain(
                "'wasm-unsafe-eval'"
            );
            expect(getCspDirectives({ env: 'production', scope: 'examples' })['script-src']).toContain(
                "'wasm-unsafe-eval'"
            );
        });

        it("style-src keeps 'unsafe-inline' in both scopes", () => {
            expect(getCspDirectives({ env: 'production', scope: 'site' })['style-src']).toContain("'unsafe-inline'");
            expect(getCspDirectives({ env: 'production', scope: 'examples' })['style-src']).toContain(
                "'unsafe-inline'"
            );
        });

        it('site scope authorises inline scripts by hash, not unsafe-inline (Phase B)', () => {
            const scriptSrc = getCspDirectives({ env: 'production', scope: 'site' })['script-src'];
            expect(scriptSrc).not.toContain("'unsafe-inline'");
            expect(scriptSrc).toContain(sha256Source(DARK_MODE_INIT_SCRIPT));
            expect(scriptSrc).toContain(sha256Source(PLAUSIBLE_INIT_SCRIPT));
            expect(scriptSrc).toContain(sha256Source(PLAUSIBLE_PAGE_LOAD_SCRIPT));
            expect(scriptSrc).toContain(sha256Source(KBD_PLATFORM_INIT_SCRIPT));
        });

        it('site scope authorises the (non-externalisable) Astro hydration scripts by hash', () => {
            // Astro's framework-injected hydration scripts cannot be externalised, so
            // they are pinned by hash (ASTRO_HYDRATION_SCRIPT_HASHES). Regenerate when
            // bumping Astro — see cspRules.ts.
            const scriptSrc = getCspDirectives({ env: 'production', scope: 'site' })['script-src'];
            expect(scriptSrc).toContain("'sha256-BrDhGE1lwa85arfXcrBxSo+n37uVSX5CAROXnIM6Q+g='"); // <astro-island> runtime
            expect(scriptSrc).toContain("'sha256-QzWFZi+FLIx23tnm9SBU4aEgx4x8DsuASP07mfqol/c='"); // client:load
            expect(scriptSrc).toContain("'sha256-BF0290pkb3jxQsE7z00xR8Imp8X34FLC88L0lkMnrGw='"); // client:idle
        });

        it('site scope authorises the GTM-injected ZoomInfo bootstrap by hash', () => {
            // Authored in the shared GTM container (not this repo); hash captured from
            // the browser CSP violation. Site only — examples keeps unsafe-inline.
            const site = getCspDirectives({ env: 'production', scope: 'site' })['script-src'];
            expect(site).toContain("'sha256-41l+jvtOjBgKy9345IStB4j1gGPGFMVXADMHn1Acs6E='");
            const examples = getCspDirectives({ env: 'production', scope: 'examples' })['script-src'];
            expect(examples).not.toContain("'sha256-41l+jvtOjBgKy9345IStB4j1gGPGFMVXADMHn1Acs6E='");
        });

        it('examples keeps unsafe-inline with no hashes; dev site keeps unsafe-inline (Phase B)', () => {
            const examples = getCspDirectives({ env: 'production', scope: 'examples' })['script-src'];
            expect(examples).toContain("'unsafe-inline'");
            expect(hasHash(examples)).toBe(false);

            const devSite = getCspDirectives({ env: 'dev', scope: 'site' })['script-src'];
            expect(devSite).toContain("'unsafe-inline'");
            expect(hasHash(devSite)).toBe(false);
        });

        it('connect-src allows data: so sized SVG/data-URI images can be fetched for resize injection', () => {
            expect(getCspDirectives({ env: 'production', scope: 'site' })['connect-src']).toContain('data:');
        });

        it('frame-src allows data: so Firefox does not block the chart PNG export download', () => {
            expect(getCspDirectives({ env: 'production', scope: 'site' })['frame-src']).toContain('data:');
        });

        it('style-src and font-src allow cdnjs for the font-icons docs example', () => {
            const site = getCspDirectives({ env: 'production', scope: 'site' });
            expect(site['style-src']).toContain('https://cdnjs.cloudflare.com');
            expect(site['font-src']).toContain('https://cdnjs.cloudflare.com');
        });

        it('Astro hydration-script hashes are still verified for the installed Astro version', () => {
            // The 'site' policy pins Astro's framework-injected hydration-runtime
            // script hashes (ASTRO_HYDRATION_SCRIPT_HASHES). Astro emits and minifies
            // these, so an upgrade can change them — leaving the pinned hashes stale
            // and (since staging enforces this scope) blocking hydration across the site.
            //
            // This test fails when Astro is upgraded so the staleness is caught here
            // rather than on staging. To fix it, regenerate the hashes and bump the
            // version — see the "HOW TO REGENERATE AFTER AN ASTRO UPGRADE" steps above
            // ASTRO_HYDRATION_SCRIPT_HASHES in cspRules.ts.
            expect(astroPackageJson.version).toBe(ASTRO_HYDRATION_HASHES_VERIFIED_FOR);
        });
    });

    describe('Enzuzo cookie-consent banner (replaces OneTrust)', () => {
        it('allows the banner bundle in script-src and its APIs in connect-src', () => {
            const site = getCspDirectives({ env: 'production', scope: 'site' });
            // GTM injects the loader as an external <script src>, so the origin is enough
            // — no inline hash, unlike the ZoomInfo bootstrap.
            expect(site['script-src']).toContain('https://app.enzuzo.com');
            // Same origin serves the banner config, cookie list and consent analytics...
            expect(site['connect-src']).toContain('https://app.enzuzo.com');
            // ...and the IAB TCF Global Vendor List comes from a sibling host.
            expect(site['connect-src']).toContain('https://gvl.enzuzo.com');
        });

        it('keeps OneTrust allowed alongside it until the GTM cutover', () => {
            // The GTM container is shared across grid/charts/studio, so one tag flip
            // switches every site while their deploys land separately — both banners must
            // stay loadable across that window.
            const site = getCspDirectives({ env: 'production', scope: 'site' });
            expect(site['script-src']).toContain('https://cdn.cookielaw.org');
            expect(site['connect-src']).toContain('https://cdn.cookielaw.org');
        });

        it("does not need 'unsafe-eval' in the site scope", () => {
            // The banner's new Function paths degrade rather than justify re-opening eval
            // site-wide; see the note above ENZUZO_APP_HOST in cspRules.ts.
            expect(getCspDirectives({ env: 'production', scope: 'site' })['script-src']).not.toContain("'unsafe-eval'");
        });

        it('applies on every page, not just the ones that render a cookies table', () => {
            // The banner loads site-wide, including on example-runner documents, so the
            // origins live in the base directives rather than a scope override.
            const scopes = ['site', 'examples'] as const;
            for (let i = 0, len = scopes.length; i < len; ++i) {
                const directives = getCspDirectives({ env: 'production', scope: scopes[i] });
                expect(directives['script-src']).toContain('https://app.enzuzo.com');
                expect(directives['connect-src']).toContain('https://app.enzuzo.com');
            }
        });
    });

    describe('LinkedIn Insight Tag', () => {
        it('allows the tag SDK in script-src and its beacon hosts in connect-src', () => {
            const site = getCspDirectives({ env: 'production', scope: 'site' });
            // GTM injects the SDK as an external <script src>, so the origin is enough — no
            // inline hash, unlike the ZoomInfo bootstrap.
            expect(site['script-src']).toContain('https://snap.licdn.com');
            // The website-actions beacon is an XHR rather than an image pixel, so the
            // permissive img-src does not cover it.
            expect(site['connect-src']).toContain('https://px.ads.linkedin.com');
            expect(site['connect-src']).toContain('https://px4.ads.linkedin.com');
        });

        it('leaves the remaining LinkedIn pixel hosts to img-src', () => {
            // dc.ads.linkedin.com and p.adsymptotic.com are image pixels; img-src is
            // deliberately permissive, so they need no entry of their own.
            const site = getCspDirectives({ env: 'production', scope: 'site' });
            expect(site['img-src']).toContain('https:');
            expect(site['script-src']).not.toContain('https://sjs.bizographics.com');
        });

        it('applies in every scope, since GTM loads the tag site-wide', () => {
            const scopes = ['site', 'examples'] as const;
            for (let i = 0, len = scopes.length; i < len; ++i) {
                const directives = getCspDirectives({ env: 'production', scope: scopes[i] });
                expect(directives['script-src']).toContain('https://snap.licdn.com');
                expect(directives['connect-src']).toContain('https://px.ads.linkedin.com');
            }
        });
    });

    describe('GA4 collect endpoints', () => {
        it('allows the apex host alongside the regional wildcard', () => {
            // gtag picks its collect host per client: region1/2.google-analytics.com for
            // EEA traffic, the apex analytics.google.com elsewhere. A `*.` host-source
            // matches subdomains only, so without an entry of its own the apex beacon is
            // blocked outright for those clients.
            const directives = getCspDirectives({ env: 'production', scope: 'site' });
            expect(directives['connect-src']).toContain('https://*.analytics.google.com');
            expect(directives['connect-src']).toContain('https://analytics.google.com');
        });
    });

    describe('getScopedCspHtaccessBlock', () => {
        it('enforce mode unsets and re-sets the enforced header inside the <If> override', () => {
            const block = getScopedCspHtaccessBlock({ env: 'production' }, 'enforce');
            const ifBlock = block.slice(block.indexOf('<If'));
            expect(ifBlock).toContain('Header always unset Content-Security-Policy\n');
            expect(ifBlock).toContain('Header always set Content-Security-Policy "');
            expect(ifBlock).toContain("'unsafe-eval'");
        });

        it('matches the /examples/ and /archive/ segment anywhere (charts nests examples under framework/gallery paths)', () => {
            expect(getScopedCspHtaccessBlock({ env: 'production' }, 'enforce')).toContain(
                '<If "%{REQUEST_URI} =~ m#/(examples|archive)/#">'
            );
        });

        it('report-only mode never unsets the enforced header', () => {
            const block = getScopedCspHtaccessBlock({ env: 'production' }, 'report-only');
            const lines = block.split('\n');
            expect(lines.find((l) => l.trim() === 'Header always unset Content-Security-Policy')).toBeUndefined();
            expect(block).not.toContain('Header always set Content-Security-Policy "');
            expect(block).toContain('Header always set Content-Security-Policy-Report-Only "');
        });
    });
});
