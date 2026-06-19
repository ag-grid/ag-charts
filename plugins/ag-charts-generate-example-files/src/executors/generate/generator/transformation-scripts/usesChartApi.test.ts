import { parseFile, usesChartApi } from './parser-utils';

describe('usesChartApi', () => {
    const detect = (src: string) => usesChartApi(parseFile(src));

    it('detects imperative chart instance methods', () => {
        expect(detect('function f() { chart.download(); }')).toBe(true);
        expect(detect('function f() { chart.getImageDataURL(); }')).toBe(true);
    });

    it('detects updateDelta as chart API usage', () => {
        // Regression: `updateDelta` shares the `update` prefix and was previously
        // excluded by the `chart.update` declarative-binding carve-out.
        expect(detect('function f() { chart.updateDelta({}); }')).toBe(true);
    });

    it('excludes the declarative chart.update call', () => {
        expect(detect('function f() { chart.update(options); }')).toBe(false);
    });

    it('detects non-create AgCharts static API usage', () => {
        expect(detect('function f() { AgCharts.download(chart); }')).toBe(true);
    });

    it('ignores AgCharts factory calls', () => {
        expect(detect('const chart = AgCharts.create(options);')).toBe(false);
    });
});
