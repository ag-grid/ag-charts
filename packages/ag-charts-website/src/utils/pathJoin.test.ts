import { pathJoin } from './pathJoin';

describe('pathJoin', () => {
    test('undefined', () => {
        expect(pathJoin()).toBe('');
    });

    test.each`
        segments                                             | expected
        ${[]}                                                | ${''}
        ${['/']}                                             | ${'/'}
        ${['/ag-charts']}                                    | ${'/ag-charts'}
        ${['/', 'ag-charts']}                                | ${'/ag-charts'}
        ${['/', 'ag-charts', 'page']}                        | ${'/ag-charts/page'}
        ${['/', 'ag-charts', 'page/']}                       | ${'/ag-charts/page'}
        ${['/', 'ag-charts', '/', 'page/']}                  | ${'/ag-charts/page'}
        ${['https://ag-charts.com', 'charts', '/', 'page/']} | ${'https://ag-charts.com/charts/page'}
    `('returns "$expected" for $segments', ({ segments, expected }) => {
        expect(pathJoin(...segments)).toBe(expected);
    });
});
