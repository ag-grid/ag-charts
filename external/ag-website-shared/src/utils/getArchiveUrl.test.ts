import { getArchiveUrl, getDocumentationArchiveUrl } from '@ag-website-shared/utils/getArchiveUrl';

describe('getArchiveUrl', () => {
    // A version archive is a directory index, so a slashless URL costs a 301 (SE-166); the version's
    // dotted segment must not be mistaken for a file extension.
    test.each`
        site        | version     | expected
        ${'charts'} | ${'13.3.1'} | ${'https://www.ag-grid.com/charts/archive/13.3.1/'}
        ${'charts'} | ${'9.3.2'}  | ${'https://charts.ag-grid.com/archive/9.3.2/'}
        ${'grid'}   | ${'27.2.0'} | ${'https://www.ag-grid.com/archive/27.2.0/'}
        ${'studio'} | ${'1.1.1'}  | ${'https://www.ag-grid.com/studio/archive/1.1.1/'}
    `('$site $version -> $expected', ({ site, version, expected }) => {
        expect(getArchiveUrl({ site, version })).toBe(expected);
    });
});

describe('getDocumentationArchiveUrl', () => {
    // The archived docs are directory indexes, so a slashless URL costs a 301 (SE-166). The slash
    // goes into the pathname, ahead of any query string or anchor, and files are left alone.
    test.each`
        site        | version     | path                                | expected
        ${'charts'} | ${'13.3.1'} | ${undefined}                        | ${'https://www.ag-grid.com/charts/archive/13.3.1/documentation/'}
        ${'charts'} | ${'9.3.2'}  | ${undefined}                        | ${'https://charts.ag-grid.com/archive/9.3.2/documentation/'}
        ${'grid'}   | ${'27.2.0'} | ${undefined}                        | ${'https://www.ag-grid.com/archive/27.2.0/'}
        ${'charts'} | ${'13.3.1'} | ${'/gallery/bar'}                   | ${'https://www.ag-grid.com/charts/archive/13.3.1/gallery/bar/'}
        ${'charts'} | ${'13.3.1'} | ${'/gallery?series=bar'}            | ${'https://www.ag-grid.com/charts/archive/13.3.1/gallery/?series=bar'}
        ${'charts'} | ${'13.3.1'} | ${'/vanilla/bars#example-grouped'}  | ${'https://www.ag-grid.com/charts/archive/13.3.1/vanilla/bars/#example-grouped'}
        ${'charts'} | ${'13.3.1'} | ${'/vanilla/bars/#example-grouped'} | ${'https://www.ag-grid.com/charts/archive/13.3.1/vanilla/bars/#example-grouped'}
        ${'charts'} | ${'13.3.1'} | ${'/vanilla/guide.pdf'}             | ${'https://www.ag-grid.com/charts/archive/13.3.1/vanilla/guide.pdf'}
    `('$site $version $path -> $expected', ({ site, version, path, expected }) => {
        expect(getDocumentationArchiveUrl({ site, version, path })).toBe(expected);
    });
});
