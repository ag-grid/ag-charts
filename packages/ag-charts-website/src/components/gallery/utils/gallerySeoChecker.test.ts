import { describe, expect, it, vi } from 'vitest';

import { galleryPageSeoProblems, gallerySeoChecker } from './gallerySeoChecker';

const page = ({
    title = 'Stacked Bar Chart Example - JavaScript Data Visualization | AG Charts',
    description = 'An interactive stacked bar chart built with AG Charts.',
    h1 = 'Stacked Bar Chart Example',
}: {
    title?: string;
    description?: string;
    h1?: string;
} = {}) =>
    `<html><head><title>${title}</title><meta name="description" content="${description}"></head>` +
    `<body><h1>${h1}</h1></body></html>`;

describe('galleryPageSeoProblems', () => {
    it('passes a page serving the copy the gallery layout resolves', () => {
        expect(galleryPageSeoProblems(page())).toEqual([]);
    });

    it('fails the retired title pattern, naming the title it found', () => {
        expect(galleryPageSeoProblems(page({ title: 'AG Charts Gallery: Stacked Bar Chart' }))).toEqual([
            'serves the retired "AG Charts Gallery: {name}" title: "AG Charts Gallery: Stacked Bar Chart"',
        ]);
    });

    it('fails a title that does not name the example intent', () => {
        expect(galleryPageSeoProblems(page({ title: 'Stacked Bar Chart | AG Charts' }))).toEqual([
            'serves a title that does not name the example intent: "Stacked Bar Chart | AG Charts"',
        ]);
    });

    it('fails a bare chart name as the H1', () => {
        expect(galleryPageSeoProblems(page({ h1: 'Stacked Bar Chart' }))).toEqual([
            'serves a bare chart name as its <h1>: "Stacked Bar Chart"',
        ]);
    });

    it('fails an empty title, meta description and H1', () => {
        expect(galleryPageSeoProblems(page({ title: '', description: '', h1: '' }))).toEqual([
            'serves an empty <title>',
            'serves an empty meta description',
            'serves an empty <h1>',
        ]);
    });

    it('fails a page missing the head and body copy entirely', () => {
        expect(galleryPageSeoProblems('<html><head></head><body></body></html>')).toEqual([
            'serves an empty <title>',
            'serves an empty meta description',
            'serves an empty <h1>',
        ]);
    });

    it('reports every problem on a page, so one build fixes them all', () => {
        expect(
            galleryPageSeoProblems(page({ title: 'Stacked Bar Chart', description: '', h1: 'Stacked Bar Chart' }))
        ).toEqual([
            'serves a title that does not name the example intent: "Stacked Bar Chart"',
            'serves an empty meta description',
            'serves a bare chart name as its <h1>: "Stacked Bar Chart"',
        ]);
    });

    it('reads the H1 through the markup the layout wraps it in', () => {
        const html = page().replace(
            '<h1>Stacked Bar Chart Example</h1>',
            '<h1 class="x"><span>Stacked Bar</span> Chart Example</h1>'
        );
        expect(galleryPageSeoProblems(html)).toEqual([]);
    });

    it('reads a title that carries an escaped ampersand', () => {
        expect(
            galleryPageSeoProblems(page({ title: 'Line Chart Example - JavaScript &amp; React | AG Charts' }))
        ).toEqual([]);
    });

    it('finds the meta description whichever way round its attributes are emitted', () => {
        const html = page().replace(
            /<meta name="description" content="([^"]*)">/,
            '<meta content="$1" name="description">'
        );
        expect(galleryPageSeoProblems(html)).toEqual([]);
    });

    it('fails the retired meta description', () => {
        const retired =
            'Example of a Stacked Bar Chart built with AG Charts JavaScript Charting Library. Edit source code ' +
            'with CodeSandbox & Plunker. View JavaScript Bar Charts documentation for more info.';
        expect(galleryPageSeoProblems(page({ description: retired }))).toEqual([
            `serves the retired meta description: "${retired}"`,
        ]);
    });

    it('passes a description carrying the brand phrasing that is still live copy elsewhere', () => {
        const description = 'A stacked bar chart built with the AG Charts JavaScript Charting Library.';
        expect(galleryPageSeoProblems(page({ description }))).toEqual([]);
    });

    it('does not mistake another meta tag for the description', () => {
        const html = page({ description: '' }).replace(
            '<meta name="description" content="">',
            '<meta name="viewport" content="width=device-width">'
        );
        expect(galleryPageSeoProblems(html)).toEqual(['serves an empty meta description']);
    });
});

describe('gallerySeoChecker', () => {
    it('throws when the build output holds no gallery pages, rather than passing vacuously', () => {
        const log = vi.fn();
        expect(() => gallerySeoChecker({ buildDir: '/no/such/build/output', log })).toThrow(/no example pages/);
        expect(log).not.toHaveBeenCalled();
    });
});
