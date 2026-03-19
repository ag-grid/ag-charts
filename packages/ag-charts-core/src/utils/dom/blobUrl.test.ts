import { dataUriToObjectURL, processCssDataUris } from './blobUrl';

const SIMPLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M0 0h20v20H0z"/></svg>';
const SIMPLE_SVG_BASE64 = btoa(SIMPLE_SVG);

let blobCounter = 0;

beforeAll(() => {
    // jsdom doesn't provide URL.createObjectURL — polyfill for tests
    if (typeof URL.createObjectURL !== 'function') {
        URL.createObjectURL = (_blob: Blob) => `blob:test-${++blobCounter}`;
        URL.revokeObjectURL = () => {};
    }
});

describe('blobUrl', () => {
    describe('dataUriToObjectURL', () => {
        it('should convert a base64 SVG data URI to a blob URL', () => {
            const dataUri = `data:image/svg+xml;base64,${SIMPLE_SVG_BASE64}`;
            const result = dataUriToObjectURL(dataUri);
            expect(result).toMatch(/^blob:/);
        });

        it('should convert a utf8-encoded SVG data URI to a blob URL', () => {
            const svgEncoded = encodeURIComponent(SIMPLE_SVG);
            const dataUri = `data:image/svg+xml;utf8,${svgEncoded}`;
            const result = dataUriToObjectURL(dataUri);
            expect(result).toMatch(/^blob:/);
        });

        it('should return the same blob URL for the same data URI (caching)', () => {
            const dataUri = `data:image/svg+xml;base64,${SIMPLE_SVG_BASE64}`;
            const first = dataUriToObjectURL(dataUri);
            const second = dataUriToObjectURL(dataUri);
            expect(first).toBe(second);
        });

        it('should return different blob URLs for different data URIs', () => {
            const dataUri1 = `data:image/svg+xml;base64,${btoa('<svg><rect/></svg>')}`;
            const dataUri2 = `data:image/svg+xml;base64,${btoa('<svg><circle/></svg>')}`;
            const result1 = dataUriToObjectURL(dataUri1);
            const result2 = dataUriToObjectURL(dataUri2);
            expect(result1).not.toBe(result2);
        });

        it('should return the original string if no comma is found', () => {
            const malformed = 'data:image/svg+xml;base64';
            const result = dataUriToObjectURL(malformed);
            expect(result).toBe(malformed);
        });
    });

    describe('processCssDataUris', () => {
        it('should replace base64 SVG data URIs in CSS with blob URLs', () => {
            const css = `.icon { --icon: url(data:image/svg+xml;base64,${SIMPLE_SVG_BASE64}); }`;
            const result = processCssDataUris(css);
            expect(result).not.toContain('data:image/svg+xml');
            expect(result).toContain('url(blob:');
        });

        it('should replace utf8 SVG data URIs in CSS with blob URLs', () => {
            const svg = encodeURIComponent(SIMPLE_SVG);
            const css = `.icon { --checker: url('data:image/svg+xml;utf8,${svg}'); }`;
            const result = processCssDataUris(css);
            expect(result).not.toContain('data:image/svg+xml');
            expect(result).toContain('url(blob:');
        });

        it('should replace multiple data URIs in the same CSS string', () => {
            const svg1 = btoa('<svg><path d="M1"/></svg>');
            const svg2 = btoa('<svg><path d="M2"/></svg>');
            const css = `.a { --x: url(data:image/svg+xml;base64,${svg1}); } .b { --y: url(data:image/svg+xml;base64,${svg2}); }`;
            const result = processCssDataUris(css);
            const blobCount = (result.match(/blob:/g) ?? []).length;
            expect(blobCount).toBe(2);
            expect(result).not.toContain('data:image/svg+xml');
        });

        it('should pass through CSS with no data URIs unchanged', () => {
            const css = '.icon { color: red; background: url(https://example.com/img.png); }';
            const result = processCssDataUris(css);
            expect(result).toBe(css);
        });

        it('should not replace non-SVG data URIs', () => {
            const css = '.icon { background: url(data:image/png;base64,iVBOR); }';
            const result = processCssDataUris(css);
            expect(result).toBe(css);
        });

        it('should preserve surrounding CSS structure', () => {
            const uniqueSvg = btoa('<svg><ellipse/></svg>');
            const css = `.before { color: red; }\n.icon { --icon: url(data:image/svg+xml;base64,${uniqueSvg}); }\n.after { color: blue; }`;
            const result = processCssDataUris(css);
            expect(result).toContain('.before { color: red; }');
            expect(result).toContain('.after { color: blue; }');
            expect(result).toContain('url(blob:');
        });
    });
});
