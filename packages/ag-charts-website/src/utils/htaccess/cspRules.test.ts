import { createHash } from 'node:crypto';

import { DARK_MODE_INIT_SCRIPT, PLAUSIBLE_INIT_SCRIPT } from '../csp/inlineScripts';
import { getCspDirectives, getScopedCspHtaccessBlock } from './cspRules';

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
