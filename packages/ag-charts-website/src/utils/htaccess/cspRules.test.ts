import { getCspDirectives, getScopedCspHtaccessBlock } from './cspRules';

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

        it("scopes differ only by script-src 'unsafe-eval'", () => {
            const site = getCspDirectives({ env: 'production', scope: 'site' });
            const examples = getCspDirectives({ env: 'production', scope: 'examples' });
            const names = Object.keys(site);
            expect(Object.keys(examples)).toEqual(names);
            for (let i = 0, len = names.length; i < len; ++i) {
                const name = names[i];
                if (name === 'script-src') {
                    expect(examples[name]).toEqual([...site[name], "'unsafe-eval'"]);
                } else {
                    expect(examples[name]).toEqual(site[name]);
                }
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

        it("both scopes keep 'unsafe-inline' in script-src and style-src", () => {
            const site = getCspDirectives({ env: 'production', scope: 'site' });
            expect(site['script-src']).toContain("'unsafe-inline'");
            expect(site['style-src']).toContain("'unsafe-inline'");
        });

        it('connect-src allows data: so sized SVG/data-URI images can be fetched for resize injection', () => {
            expect(getCspDirectives({ env: 'production', scope: 'site' })['connect-src']).toContain('data:');
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
