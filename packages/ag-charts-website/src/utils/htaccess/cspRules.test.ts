import astroPackageJson from 'astro/package.json';
import { createHash } from 'node:crypto';

import { aggregateCspViolations } from '../csp/cspViolationReport';
import {
    DARK_MODE_INIT_SCRIPT,
    KBD_PLATFORM_INIT_SCRIPT,
    PLAUSIBLE_INIT_SCRIPT,
    PLAUSIBLE_PAGE_LOAD_SCRIPT,
} from '../csp/inlineScripts';
import {
    ACCEPTED_CSP_VIOLATIONS,
    ASTRO_HYDRATION_HASHES_VERIFIED_FOR,
    getCspDirectives,
    getScopedCspHtaccessBlock,
} from './cspRules';

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
            // Astro's hydration scripts cannot be externalised; regenerate on an Astro bump.
            const scriptSrc = getCspDirectives({ env: 'production', scope: 'site' })['script-src'];
            expect(scriptSrc).toContain("'sha256-BrDhGE1lwa85arfXcrBxSo+n37uVSX5CAROXnIM6Q+g='"); // <astro-island> runtime
            expect(scriptSrc).toContain("'sha256-QzWFZi+FLIx23tnm9SBU4aEgx4x8DsuASP07mfqol/c='"); // client:load
            expect(scriptSrc).toContain("'sha256-BF0290pkb3jxQsE7z00xR8Imp8X34FLC88L0lkMnrGw='"); // client:idle
        });

        it('site scope authorises the GTM-injected ZoomInfo bootstrap by hash', () => {
            // Authored in the shared GTM container; hash captured from the browser violation.
            const site = getCspDirectives({ env: 'production', scope: 'site' })['script-src'];
            expect(site).toContain("'sha256-41l+jvtOjBgKy9345IStB4j1gGPGFMVXADMHn1Acs6E='");
            const examples = getCspDirectives({ env: 'production', scope: 'examples' })['script-src'];
            expect(examples).not.toContain("'sha256-41l+jvtOjBgKy9345IStB4j1gGPGFMVXADMHn1Acs6E='");
        });

        it('site scope authorises the Enzuzo -> GTM consent bridge by hash', () => {
            // Injected inline by the banner to pass the consent decision to GTM.
            const site = getCspDirectives({ env: 'production', scope: 'site' })['script-src'];
            expect(site).toContain("'sha256-NSYHvOQXo5WNxDt0/+l9AbSTx6N4CkkrbuSSa6ERhlo='");
            const examples = getCspDirectives({ env: 'production', scope: 'examples' })['script-src'];
            expect(examples).not.toContain("'sha256-NSYHvOQXo5WNxDt0/+l9AbSTx6N4CkkrbuSSa6ERhlo='");
        });

        it('derives the consent-bridge hash from the recorded script source', () => {
            // If this fails the recorded source was edited: re-check it against a real browser
            // rather than updating the expected digest.
            expect(sha256Source('if (window.enzuzoGtmConsent) { window.enzuzoGtmConsent(); }')).toBe(
                "'sha256-NSYHvOQXo5WNxDt0/+l9AbSTx6N4CkkrbuSSa6ERhlo='"
            );
        });

        it('site scope authorises both GTM UTM-attribution tags by hash', () => {
            // Hashable only because neither tag interpolates a GTM variable — see the note above
            // GTM_UTM_CAPTURE_HASH in cspRules.ts.
            const site = getCspDirectives({ env: 'production', scope: 'site' })['script-src'];
            expect(site).toContain("'sha256-nsp/0430/yfuSNjsteV2fUwjHINMowl9qldFKy6PKJs='"); // page-view capture
            expect(site).toContain("'sha256-7f34QP24yF/YC+G6zSHRCBZrBez6xFf6GbcGIXkZ4K0='"); // webhook POST (live)
        });

        it('also authorises the updated capturing-phase webhook listener', () => {
            // The submit listener now adds a third `true` argument to addEventListener
            // (capturing phase) — otherwise byte-identical to the live tag above. Kept
            // alongside it until the rollout is complete and the old hash is confirmed
            // unused. AG-3390.
            const site = getCspDirectives({ env: 'production', scope: 'site' })['script-src'];
            expect(site).toContain("'sha256-1biJs72+znqmnYHTG0Ps3v04No9BtvG8+3CNYyK5djo='");
        });

        it('allows the Make webhook in connect-src for the attribution POST', () => {
            const site = getCspDirectives({ env: 'production', scope: 'site' });
            expect(site['connect-src']).toContain('https://hook.eu2.make.com');
            // A fetch target, not a script source.
            expect(site['script-src']).not.toContain('https://hook.eu2.make.com');
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
            // Fails on an Astro upgrade so stale hydration hashes are caught here rather than
            // by broken hydration on staging; see the regeneration steps in cspRules.ts.
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
            // The shared GTM container flips all three sites at once, while their deploys land
            // separately — both banners must stay loadable across that window.
            const site = getCspDirectives({ env: 'production', scope: 'site' });
            expect(site['script-src']).toContain('https://cdn.cookielaw.org');
            expect(site['connect-src']).toContain('https://cdn.cookielaw.org');
        });

        it("does not need 'unsafe-eval' in the site scope", () => {
            // The banner's new Function paths degrade rather than justify re-opening eval
            // site-wide; see the note above ENZUZO_APP_HOST in cspRules.ts.
            expect(getCspDirectives({ env: 'production', scope: 'site' })['script-src']).not.toContain("'unsafe-eval'");
        });

        it('accepts the blocked eval from its cookiebar bundle, and only that', () => {
            // The shape the post-deploy suite actually observes on staging, so the acceptance
            // stops matching if Enzuzo moves the bundle or the browser reports it differently.
            const observed = {
                directive: 'script-src',
                blockedUri: 'eval',
                disposition: 'enforce' as const,
                sourceFile: 'https://app.enzuzo.com/scripts/cookiebar/061e8460-91b3-11f1-98ff-978c2fcf2681',
                pageUrl: 'https://charts-staging.ag-grid.com/',
            };
            const aggregate = (record: typeof observed) =>
                aggregateCspViolations([{ record, testTitle: 'homepage loads' }], [], ACCEPTED_CSP_VIOLATIONS)[0];

            expect(aggregate(observed).accepted).toEqual(expect.stringContaining('Enzuzo'));
            // The consent-bridge hash going stale must still surface...
            expect(aggregate({ ...observed, blockedUri: 'inline' })).not.toHaveProperty('accepted');
            // ...as must an eval from anything other than the banner bundle.
            expect(
                aggregate({ ...observed, sourceFile: 'https://app.enzuzo.com/scripts/cookies/061e8460' })
            ).not.toHaveProperty('accepted');
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
            // The website-actions beacon and the attribution trigger are a sendBeacon and a
            // fetch rather than image pixels, so the permissive img-src does not cover them.
            expect(site['connect-src']).toContain('https://px.ads.linkedin.com');
        });

        it('trusts no LinkedIn origin the shipped tag does not contact', () => {
            // See the note above LINKEDIN_SDK_HOST in cspRules.ts.
            const site = getCspDirectives({ env: 'production', scope: 'site' });
            expect(site['img-src']).toContain('https:');
            const unused = [
                'https://px4.ads.linkedin.com',
                'https://dc.ads.linkedin.com',
                'https://p.adsymptotic.com',
                'https://cdn.linkedin.oribi.io',
                'https://gw.linkedin.oribi.io',
                'https://sjs.bizographics.com',
            ];
            for (let i = 0, len = unused.length; i < len; ++i) {
                expect(site['script-src']).not.toContain(unused[i]);
                expect(site['connect-src']).not.toContain(unused[i]);
            }
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

    describe('Google Ads conversion tracking (AW-873243008)', () => {
        it('allows the conversion beacon hosts in connect-src', () => {
            // The beacon tries fetch() to these before falling back to an <img> pixel, so the
            // permissive img-src alone is not enough to stop it logging a violation.
            const site = getCspDirectives({ env: 'production', scope: 'site' });
            expect(site['connect-src']).toContain('https://www.googleadservices.com');
            expect(site['connect-src']).toContain('https://pagead2.googlesyndication.com');
            // /ccm/s/collect, sent with the Fetch API once marketing consent is granted.
            expect(site['connect-src']).toContain('https://ad.doubleclick.net');
        });

        it('allows the view-through conversion tag in script-src', () => {
            // GTM injects /pagead/viewthroughconversion/<id> as an external <script>, so this
            // is a script-src origin rather than a beacon target. Only fires once marketing
            // consent is granted, which is why it did not show up in consent-denied testing.
            const site = getCspDirectives({ env: 'production', scope: 'site' });
            expect(site['script-src']).toContain('https://googleads.g.doubleclick.net');
        });

        it('keeps the ads hosts out of the directive that does not need them', () => {
            const site = getCspDirectives({ env: 'production', scope: 'site' });
            // The remarketing tag is a script source, not a fetch target...
            expect(site['connect-src']).not.toContain('https://googleads.g.doubleclick.net');
            // ...and the conversion beacon hosts are fetch targets, not script sources.
            expect(site['script-src']).not.toContain('https://ad.doubleclick.net');
            expect(site['script-src']).not.toContain('https://pagead2.googlesyndication.com');
        });

        it('trusts no ads origin that only appears as a dead gtag.js fallback', () => {
            // Both show up as unreached fallbacks in every gtag.js payload; add them only if a
            // violation actually shows up — see the note above GOOGLE_ADS_SDK_HOST.
            const site = getCspDirectives({ env: 'production', scope: 'site' });
            const unused = ['https://adservice.google.com', 'https://ade.googlesyndication.com'];
            for (let i = 0, len = unused.length; i < len; ++i) {
                expect(site['script-src']).not.toContain(unused[i]);
                expect(site['connect-src']).not.toContain(unused[i]);
            }
        });

        it('applies in every scope, since GTM loads the tag site-wide', () => {
            const scopes = ['site', 'examples'] as const;
            for (let i = 0, len = scopes.length; i < len; ++i) {
                const directives = getCspDirectives({ env: 'production', scope: scopes[i] });
                expect(directives['connect-src']).toContain('https://www.googleadservices.com');
                expect(directives['connect-src']).toContain('https://pagead2.googlesyndication.com');
                expect(directives['connect-src']).toContain('https://ad.doubleclick.net');
                expect(directives['script-src']).toContain('https://googleads.g.doubleclick.net');
            }
        });

        it('authorises the internal promo-tracking GA4 event tag by hash in the site scope', () => {
            const site = getCspDirectives({ env: 'production', scope: 'site' })['script-src'];
            expect(site).toContain("'sha256-nC2/ZWBpMyJEdVw5YxKBKxSMNwMN/lOAPrHk4RcIBbc='");
            const examples = getCspDirectives({ env: 'production', scope: 'examples' })['script-src'];
            expect(examples).not.toContain("'sha256-nC2/ZWBpMyJEdVw5YxKBKxSMNwMN/lOAPrHk4RcIBbc='");
        });
    });

    describe('GA4 collect endpoints', () => {
        it('allows the apex host alongside the regional wildcard', () => {
            // A `*.` host-source matches subdomains only, so the apex host gtag uses outside
            // the EEA needs an entry of its own.
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
