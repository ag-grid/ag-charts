import { getDemoOpenInLinks, getSeedGithubUrl, getSeedReleaseTag, getSeedStackBlitzUrl } from './seedLinks';

describe('seedLinks', () => {
    describe('getSeedReleaseTag', () => {
        test.each`
            version                     | expected
            ${'14.2.0'}                 | ${'release-14.2.0'}
            ${'14.2.1'}                 | ${'release-14.2.1'}
            ${'14.2.0-beta.20260920'}   | ${'release-14.2.0'}
            ${'15.0.0-beta.20260920.9'} | ${'release-15.0.0'}
        `('maps $version to $expected', ({ version, expected }) => {
            expect(getSeedReleaseTag(version)).toBe(expected);
        });

        test('rejects a version it cannot parse', () => {
            expect(() => getSeedReleaseTag('unknown')).toThrow('unknown');
        });
    });

    test('getSeedGithubUrl points at the seed folder at the release tag', () => {
        expect(getSeedGithubUrl({ demoId: 'financial', framework: 'react', version: '14.2.0' })).toBe(
            'https://github.com/ag-grid/ag-charts/tree/release-14.2.0/packages/ag-charts-demos/seeds/financial/react'
        );
    });

    test('getSeedStackBlitzUrl opens the same folder with an encoded project title', () => {
        expect(
            getSeedStackBlitzUrl({
                demoId: 'web-analytics',
                framework: 'react',
                title: 'Web Analytics',
                version: '14.2.0-beta.20260920',
            })
        ).toBe(
            'https://stackblitz.com/github/ag-grid/ag-charts/tree/release-14.2.0/packages/ag-charts-demos/seeds/web-analytics/react?title=AG%20Charts%20Web%20Analytics%20(React)'
        );
    });

    test('getDemoOpenInLinks offers the React seed only, for now', () => {
        expect(getDemoOpenInLinks({ demoId: 'financial', title: 'Trading Terminal', version: '14.2.0' })).toEqual([
            {
                framework: 'React',
                href: 'https://stackblitz.com/github/ag-grid/ag-charts/tree/release-14.2.0/packages/ag-charts-demos/seeds/financial/react?title=AG%20Charts%20Trading%20Terminal%20(React)',
                sourceHref:
                    'https://github.com/ag-grid/ag-charts/tree/release-14.2.0/packages/ag-charts-demos/seeds/financial/react',
            },
        ]);
    });
});
