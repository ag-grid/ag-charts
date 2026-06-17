import { extractHeadLinks } from './extract-head-elements';

describe('extractHeadLinks', () => {
    it('extracts a single link element and removes it from the body', () => {
        const html = `<link rel="stylesheet" href="https://example.com/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
<div id="myChart"></div>`;

        const { head, body } = extractHeadLinks(html);

        expect(head).toContain('rel="stylesheet"');
        expect(head).toContain('href="https://example.com/all.min.css"');
        expect(head).toContain('crossorigin="anonymous"');
        expect(head).toContain('referrerpolicy="no-referrer"');
        expect(body).not.toContain('<link');
        expect(body).toContain('<div id="myChart"></div>');
    });

    it('extracts multiple link elements', () => {
        const html = `<link rel="stylesheet" href="a.css" />
<link rel="stylesheet" href="b.css" />
<div id="myChart"></div>`;

        const { head, body } = extractHeadLinks(html);

        expect(head).toContain('href="a.css"');
        expect(head).toContain('href="b.css"');
        expect(body).not.toContain('<link');
    });

    it('returns an empty head and the unchanged body when there are no link elements', () => {
        const html = `<div id="myChart"></div>`;

        const { head, body } = extractHeadLinks(html);

        expect(head).toBe('');
        expect(body).toBe(html);
    });

    it('preserves other body content such as example controls', () => {
        const html = `<link rel="stylesheet" href="a.css" />
<div id="controls"><button id="toggle">Toggle</button></div>
<div id="myChart"></div>`;

        const { body } = extractHeadLinks(html);

        expect(body).toContain('<div id="controls">');
        expect(body).toContain('<button id="toggle">Toggle</button>');
        expect(body).toContain('<div id="myChart"></div>');
    });
});
