import { getDocumentationArchiveUrl } from '@ag-website-shared/utils/getArchiveUrl';

describe('getDocumentationArchiveUrl', () => {
    // The archived docs are directory indexes, so a slashless URL costs a 301 (SE-166).
    it('slashes the charts documentation link', () => {
        expect(getDocumentationArchiveUrl({ site: 'charts', version: '13.3.1' })).toBe(
            'https://www.ag-grid.com/charts/archive/13.3.1/documentation/'
        );
    });

    it('slashes the legacy charts origin the same way', () => {
        expect(getDocumentationArchiveUrl({ site: 'charts', version: '9.3.2' })).toBe(
            'https://charts.ag-grid.com/archive/9.3.2/documentation/'
        );
    });

    it('slashes an explicit path', () => {
        expect(getDocumentationArchiveUrl({ site: 'charts', version: '13.3.1', path: '/gallery/bar' })).toBe(
            'https://www.ag-grid.com/charts/archive/13.3.1/gallery/bar/'
        );
    });

    it('leaves a path carrying an anchor alone', () => {
        expect(
            getDocumentationArchiveUrl({ site: 'charts', version: '13.3.1', path: '/vanilla/bars/#example-grouped' })
        ).toBe('https://www.ag-grid.com/charts/archive/13.3.1/vanilla/bars/#example-grouped');
    });
});
