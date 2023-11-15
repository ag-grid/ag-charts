import { pathJoin } from './pathJoin';

describe('pathJoin', () => {
    test.each`
        params                                                          | expected
        ${undefined}                                                    | ${''}
        ${{}}                                                           | ${''}
        ${{ path: [undefined] }}                                        | ${''}
        ${{ path: ['/'] }}                                              | ${'/'}
        ${{ path: ['/', undefined] }}                                   | ${'/'}
        ${{ path: ['/ag-charts'] }}                                     | ${'/ag-charts'}
        ${{ path: ['/', 'ag-charts'] }}                                 | ${'/ag-charts'}
        ${{ path: ['/', 'ag-charts', 'page'] }}                         | ${'/ag-charts/page'}
        ${{ path: ['/', 'ag-charts', 'page/'] }}                        | ${'/ag-charts/page/'}
        ${{ path: ['/', 'ag-charts', '/', 'page/'] }}                   | ${'/ag-charts/page/'}
        ${{ path: ['https://ag-charts.com', 'charts', '/', 'page/'] }}  | ${'https://ag-charts.com/charts/page/'}
        ${{ path: [new URL('http://localhost:4600/'), '/ag-charts/'] }} | ${'http://localhost:4600/ag-charts/'}
        ${{ path: ['/ag-charts'], addTrailingSlash: true }}             | ${'/ag-charts/'}
    `('returns "$expected" for $params', ({ params, expected }) => {
        expect(pathJoin(params)).toBe(expected);
    });
});
