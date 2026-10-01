import { followRedirects, simulateRequest } from './htaccessSimulator';

// The evaluator is only as good as its model of Apache, so its semantics are pinned here against
// behaviour observed on a real Apache 2.4 serving the generated files: the per-directory pattern,
// AllowNoSlash, mod_rewrite's own Vary, [NE], mod_dir's index.html internal redirect, the
// ErrorDocument and the always/onsuccess header tables.
const site = (htaccess: string, files: string[] = []) => ({ htaccess, basePath: '/base', files });

describe('htaccessSimulator', () => {
    it('matches rule patterns against the path below the .htaccess directory', () => {
        const s = site('RewriteRule "^old/?$" "/base/new/" [R=301,L]');
        expect(simulateRequest(s, { uri: '/base/old/' })).toMatchObject({ status: 301, location: '/base/new/' });
        expect(simulateRequest(s, { uri: '/base/x/old/' })).toMatchObject({ status: 404 });
    });

    it("skips the directory's own slash-less URL unless RewriteOptions AllowNoSlash is set", () => {
        const rules = 'RewriteRule ^ https://www.ag-grid.com%{REQUEST_URI}/ [R=301,L]';
        expect(simulateRequest(site(rules, ['/base/index.html']), { uri: '/base' })).toMatchObject({
            status: 301,
            location: 'http://www.ag-grid.com/base/', // mod_dir's slash redirect, not the rule
        });
        expect(
            simulateRequest(site(`RewriteOptions AllowNoSlash\n${rules}`, ['/base/index.html']), { uri: '/base' })
        ).toMatchObject({ status: 301, location: 'https://www.ag-grid.com/base/' });
    });

    it('escapes a fragment in a redirect target unless the rule carries [NE]', () => {
        expect(simulateRequest(site('RewriteRule ^a$ /base/b/#c [R=301,L]'), { uri: '/base/a' }).location).toBe(
            '/base/b/%23c'
        );
        expect(simulateRequest(site('RewriteRule ^a$ /base/b/#c [R=301,NE,L]'), { uri: '/base/a' }).location).toBe(
            '/base/b/#c'
        );
    });

    it('evaluates [OR] chains, negation, NC and %N back-references', () => {
        const s = site(
            [
                'RewriteCond %{HTTP_HOST} ^a\\.com$ [NC,OR]',
                'RewriteCond %{HTTP_HOST} ^b\\.com$ [NC]',
                'RewriteCond %{REQUEST_URI} ^/base/(x+)$',
                'RewriteRule ^ /base/%1/ [R=301,L]',
            ].join('\n')
        );
        expect(simulateRequest(s, { host: 'B.com', uri: '/base/xx' })).toMatchObject({ location: '/base/xx/' });
        expect(simulateRequest(s, { host: 'c.com', uri: '/base/xx' }).status).toBe(404);
    });

    it('serves a slashed directory through index.html, which the rules and <If> see', () => {
        const s = site('<If "%{REQUEST_URI} =~ m#/index\\.html$#">\n    Header append Vary Accept\n</If>', [
            '/base/page/index.html',
        ]);
        expect(simulateRequest(s, { uri: '/base/page/' })).toEqual({
            status: 200,
            servedFile: '/base/page/index.html',
            contentType: 'text/html',
            headers: { vary: 'Accept' },
        });
    });

    it('adds Vary for a header tested by a rule that applied, and re-runs the rules after a rewrite', () => {
        const s = site(
            [
                'AddType text/markdown md',
                'AddCharset utf-8 .md',
                'RewriteCond %{HTTP_ACCEPT} text/markdown',
                'RewriteCond %{REQUEST_URI} ^/(base/page)/?$',
                'RewriteCond %{DOCUMENT_ROOT}/%1.md -f',
                'RewriteRule ^ /%1.md [L]',
            ].join('\n'),
            ['/base/page/index.html', '/base/page.md']
        );
        expect(simulateRequest(s, { uri: '/base/page/', accept: 'text/markdown' })).toEqual({
            status: 200,
            servedFile: '/base/page.md',
            contentType: 'text/markdown; charset=utf-8',
            headers: { vary: 'Accept' },
        });
        expect(simulateRequest(s, { uri: '/base/page/', accept: 'text/html' }).headers).toEqual({});
    });

    it('serves a 404 from the ErrorDocument, whose path and status the header expressions see', () => {
        const s = site(
            [
                'ErrorDocument 404 /base/404.html',
                'Header set X-Ok "1" "expr=%{REQUEST_STATUS} == 200"',
                'Header set X-Error-Uri "1" "expr=%{REQUEST_URI} == \'/base/404.html\' && %{CONTENT_TYPE} =~ m#^text/html#"',
            ].join('\n'),
            ['/base/404.html']
        );
        expect(simulateRequest(s, { uri: '/base/missing/' })).toEqual({
            status: 404,
            servedFile: '/base/404.html',
            contentType: 'text/html',
            headers: { 'x-error-uri': '1' },
        });
    });

    it('sends only the `always` headers with a redirect or a 410', () => {
        const s = site(
            [
                'Header set X-A "1"',
                'Header always set X-B "1"',
                'RewriteRule ^a$ /x [R=301,L]',
                'RewriteRule ^g$ - [G]',
            ].join('\n')
        );
        expect(simulateRequest(s, { uri: '/base/a' }).headers).toEqual({ 'x-b': '1' });
        expect(simulateRequest(s, { uri: '/base/g' })).toMatchObject({ status: 410, headers: { 'x-b': '1' } });
    });

    it('applies <If> sections after every other directive in the file, whatever their position', () => {
        const s = site(
            ['<If "%{REQUEST_URI} =~ m#^/#">', '    Header set X "if"', '</If>', 'Header set X "plain"'].join('\n'),
            ['/base/f.txt']
        );
        expect(simulateRequest(s, { uri: '/base/f.txt' }).headers).toEqual({ x: 'if' });
    });

    it('rejects directives and flags outside the modelled subset, rather than ignoring them', () => {
        expect(() => simulateRequest(site('Redirect 301 /a /b'), { uri: '/base/a' })).toThrow(/Unsupported directive/);
        expect(() => simulateRequest(site('RewriteRule ^a$ /b [QSA,L]'), { uri: '/base/a' })).toThrow(/flag/);
        expect(() => simulateRequest(site('<Files "x">\n</Files>'), { uri: '/base/a' })).toThrow(/section/);
    });

    it('follows redirects across hosts and counts the hops', () => {
        const s = site(
            [
                'RewriteRule "^a/?$" "https://www.ag-grid.com/base/b/" [R=301,L]',
                'RewriteRule "^b/?$" "https://www.ag-grid.com/base/c/" [R=301,L]',
            ].join('\n'),
            ['/base/c/index.html']
        );
        const { hops, final } = followRedirects(s, { host: 'ag-grid.com', uri: '/base/a' });
        expect(hops).toEqual(['https://www.ag-grid.com/base/b/', 'https://www.ag-grid.com/base/c/']);
        expect(final.status).toBe(200);
    });
});
