import { moveImportMapBeforeHeadScripts } from './moveImportMapBeforeHeadScripts';

describe('moveImportMapBeforeHeadScripts', () => {
    it('moves a body-level importmap to the start of head, ahead of an existing module script', () => {
        const html = [
            '<!DOCTYPE html>',
            '<html>',
            '<head><script type="module" src="/@vite/client"></script></head>',
            '<body>',
            '<script src="/example-runner.js"></script>',
            '<script type="importmap">',
            '{',
            '    "imports": { "react": "https://esm.sh/react@19.2.4" }',
            '}',
            '</script>',
            '<script>agExampleRunner.setUpPage();</script>',
            '<script type="module" src="/index.js"></script>',
            '</body>',
            '</html>',
        ].join('\n');

        const result = moveImportMapBeforeHeadScripts(html);

        const headIndex = result.indexOf('<head');
        const importMapIndex = result.indexOf('<script type="importmap">');
        const viteClientIndex = result.indexOf('<script type="module" src="/@vite/client">');
        const entryModuleIndex = result.indexOf('<script type="module" src="/index.js">');

        expect(importMapIndex).toBeGreaterThan(headIndex);
        expect(importMapIndex).toBeLessThan(viteClientIndex);
        expect(importMapIndex).toBeLessThan(entryModuleIndex);
        expect(result).toContain('"react": "https://esm.sh/react@19.2.4"');
        // Only one copy of the importmap remains
        expect(result.match(/<script type="importmap">/g)).toHaveLength(1);
    });

    it('is a no-op when there is no importmap script', () => {
        const html = '<html><head></head><body><script type="module" src="/index.js"></script></body></html>';

        expect(moveImportMapBeforeHeadScripts(html)).toBe(html);
    });

    it('handles attributes on the head tag', () => {
        const html =
            '<html><head data-foo="bar"><title>t</title></head>' +
            '<body><script type="importmap">{"imports":{}}</script></body></html>';

        const result = moveImportMapBeforeHeadScripts(html);

        expect(result.indexOf('<script type="importmap">')).toBe(
            result.indexOf('<head data-foo="bar">') + '<head data-foo="bar">'.length
        );
    });
});
