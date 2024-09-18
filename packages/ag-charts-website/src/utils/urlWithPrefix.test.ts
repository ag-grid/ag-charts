import { urlWithPrefix } from './urlWithPrefix';

describe('urlWithPrefix', () => {
    test.each`
        url                      | framework       | expected
        ${'./docs'}              | ${'javascript'} | ${'/ag-charts/javascript/docs/'}
        ${'./with-slash/'}       | ${'javascript'} | ${'/ag-charts/javascript/with-slash/'}
        ${'./docs'}              | ${'react'}      | ${'/ag-charts/react/docs/'}
        ${'./docs/path'}         | ${'react'}      | ${'/ag-charts/react/docs/path/'}
        ${'/gallery'}            | ${'react'}      | ${'/ag-charts/gallery/'}
        ${'/with-slash/'}        | ${'javascript'} | ${'/ag-charts/with-slash/'}
        ${'https://youtube.com'} | ${'react'}      | ${'https://youtube.com'}
        ${'./someImage.png'}     | ${'javascript'} | ${'/ag-charts/javascript/someImage.png'}
        ${'/someImage.png'}      | ${'javascript'} | ${'/ag-charts/someImage.png'}
    `('returns $expected for url $url, framework $framework siteBaseUrl /ag-charts', ({ url, framework, expected }) => {
        const siteBaseUrl = '/ag-charts';
        expect(urlWithPrefix({ url, framework, siteBaseUrl })).toBe(expected);
    });

    test.each`
        url                  | framework       | expected
        ${'./docs'}          | ${'javascript'} | ${'/ag-charts/javascript/docs'}
        ${'./with-slash/'}   | ${'javascript'} | ${'/ag-charts/javascript/with-slash/'}
        ${'./docs'}          | ${'react'}      | ${'/ag-charts/react/docs'}
        ${'./docs/path'}     | ${'react'}      | ${'/ag-charts/react/docs/path'}
        ${'/gallery'}        | ${'react'}      | ${'/ag-charts/gallery'}
        ${'/with-slash/'}    | ${'javascript'} | ${'/ag-charts/with-slash/'}
        ${'./someImage.png'} | ${'javascript'} | ${'/ag-charts/javascript/someImage.png'}
        ${'/someImage.png'}  | ${'javascript'} | ${'/ag-charts/someImage.png'}
    `(
        'returns without trailing slash in $expected for url $url, framework $framework siteBaseUrl /ag-charts',
        ({ url, framework, expected }) => {
            const siteBaseUrl = '/ag-charts';
            expect(urlWithPrefix({ url, framework, siteBaseUrl, trailingSlash: false })).toBe(expected);
        }
    );

    test.each`
        url                        | framework       | expected
        ${'https://youtube.com'}   | ${'javascript'} | ${'https://youtube.com'}
        ${'./docs/path#some-hash'} | ${'javascript'} | ${'/ag-charts/javascript/docs/path#some-hash'}
    `(
        '$expected ignores trailing slash config for url $url, framework $framework siteBaseUrl /ag-charts',
        ({ url, framework, expected }) => {
            const siteBaseUrl = '/ag-charts';
            expect(urlWithPrefix({ url, framework, siteBaseUrl, trailingSlash: true })).toBe(expected);
        }
    );

    test('warns for invalid links', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        urlWithPrefix({ url: '../unhandled-link-type', framework: 'javascript', siteBaseUrl: '' });
        expect(spy).toBeCalled();
    });
});
