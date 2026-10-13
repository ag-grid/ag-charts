import { describe, expect, it } from 'vitest';

import { buildThemeParamsGraph, collectRefs, formatDefault, treePath } from './themeParamsGraph';

const defaults = {
    foregroundColor: '#181d1f',
    backgroundColor: '#ffffff',
    fontSize: 12,
    borderWidth: 1,
    textColor: { $ref: 'foregroundColor' },
    borderColor: { $foregroundBackgroundMix: 0.15 },
    subtleTextColor: { $mix: [{ $ref: 'textColor' }, { $ref: 'backgroundColor' }, 0.38] },
    titleFontSize: { $rem: 1.4166666666666667 },
    buttonBorder: { color: { $ref: 'borderColor' }, width: { $ref: 'borderWidth' } },
};

const templates = {
    bar: {
        title: { color: { $ref: 'textColor' }, fontSize: { $ref: 'titleFontSize' } },
        axes: { number: { label: { color: { $ref: 'textColor' } } } },
        series: { stroke: { $mix: [{ $ref: 'subtleTextColor' }, { $ref: 'privateParam' }, 0.5] } },
    },
    line: {
        title: { color: { $ref: 'textColor' } },
    },
};

describe('formatDefault', () => {
    it.each([
        [{ $ref: 'textColor' }, 'textColor'],
        [{ $mix: [{ $ref: 'textColor' }, { $ref: 'backgroundColor' }, 0.38] }, 'textColor 62% + backgroundColor 38%'],
        [{ $foregroundBackgroundMix: 0.15 }, 'foregroundColor 15% + backgroundColor 85%'],
        [{ $rem: 1.4166666666666667 }, 'fontSize × 1.42'],
        [{ $multiply: [0.5, { $ref: 'borderRadius' }] }, '0.5 × borderRadius'],
        [{ color: { $ref: 'borderColor' }, width: { $ref: 'borderWidth' } }, 'color: borderColor, width: borderWidth'],
        ['#ffffff', '#ffffff'],
        [4, '4'],
    ])('formats %j', (value, expected) => {
        expect(formatDefault(value)).toBe(expected);
    });
});

describe('collectRefs', () => {
    it('includes the params read implicitly by operations', () => {
        expect(collectRefs({ $foregroundBackgroundMix: 0.1 })).toEqual(['foregroundColor', 'backgroundColor']);
        expect(collectRefs({ $rem: 1.2 })).toEqual(['fontSize']);
    });
});

describe('buildThemeParamsGraph', () => {
    const { params, seriesTypeCount } = buildThemeParamsGraph(defaults, templates);

    it('links each param to the params its default reads, primary parent first', () => {
        expect(params.get('subtleTextColor')!.parents).toEqual(['textColor', 'backgroundColor']);
        expect(params.get('buttonBorder')!.parents).toEqual(['borderColor', 'borderWidth']);
        expect(params.get('foregroundColor')!.children).toEqual(['textColor', 'borderColor']);
        expect(params.get('foregroundColor')!.isRoot).toBe(true);
    });

    it('builds the primary inheritance chain and tree path', () => {
        const node = params.get('subtleTextColor')!;
        expect(node.chain).toEqual(['subtleTextColor', 'textColor', 'foregroundColor']);
        expect(treePath(node)).toEqual(['foregroundColor', 'textColor', 'subtleTextColor']);
    });

    it('records option paths per param and merges series types', () => {
        expect(seriesTypeCount).toBe(2);
        expect(params.get('textColor')!.options).toEqual([
            { path: 'axes.number.label.color', seriesTypes: ['bar'], direct: true },
            { path: 'title.color', seriesTypes: ['bar', 'line'], direct: true },
        ]);
        expect(params.get('subtleTextColor')!.options).toEqual([
            { path: 'series.stroke', seriesTypes: ['bar'], direct: false },
        ]);
    });

    it('counts unique option paths reached through descendants', () => {
        expect(params.get('textColor')!.totalOptionCount).toBe(3);
        expect(params.get('foregroundColor')!.totalOptionCount).toBe(3);
        expect(params.get('fontSize')!.totalOptionCount).toBe(1);
    });

    it('names the CSS variable the chart exposes', () => {
        expect(params.get('subtleTextColor')!.cssVariable).toBe('--ag-charts-subtle-text-color');
    });
});
