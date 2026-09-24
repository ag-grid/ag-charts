import { describe, expect, it } from 'vitest';

import type { AgChartOptions, AgChartTheme } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { setupEnterpriseModules } from '../setup';

setupEnterpriseModules();

describe('gradient legend theme params', () => {
    const resolveGradientLegend = (gradientLegend: object = {}, theme?: AgChartTheme): Record<string, any> => {
        const options = {
            data: [{ x: 'a', y: 'b', c: 1 }],
            series: [{ type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'c' }],
            gradientLegend,
            theme,
        } as unknown as AgChartOptions;
        const { processedOptions } = new _ModuleSupport.ChartOptions(
            options,
            {} as AgChartOptions,
            {},
            {},
            {}
        ) as unknown as { processedOptions: { gradientLegend: Record<string, any> } };
        return processedOptions.gradientLegend;
    };

    describe('defaults', () => {
        it('resolves the default container and scale label styling', () => {
            const legend = resolveGradientLegend();
            expect(legend.fill).toBe('transparent');
            expect(legend.padding).toBe(0);
            expect(legend.cornerRadius).toBe(4);
            expect(legend.border).toEqual({ enabled: false, stroke: '#c5c7c7', strokeOpacity: 1, strokeWidth: 1 });
            expect(legend.scale.label).toMatchObject({ color: '#181d1f', fontSize: 12, fontWeight: 400 });
        });

        it('pads a legend with a border enabled through the options', () => {
            const legend = resolveGradientLegend({ border: { enabled: true } });
            expect(legend.padding).toBe(5);
            expect(legend.border).toMatchObject({ enabled: true, stroke: '#c5c7c7', strokeWidth: 1 });
        });

        it('pads a legend with a fill set through the options', () => {
            const legend = resolveGradientLegend({ fill: 'red' });
            expect(legend.padding).toBe(5);
            expect(legend.fill).toBe('red');
        });
    });

    describe('params', () => {
        it('applies the container params', () => {
            const legend = resolveGradientLegend(
                {},
                {
                    params: {
                        legendBackgroundColor: 'red',
                        legendPadding: 10,
                        legendBorder: { color: 'blue', width: 2 },
                        legendBorderRadius: 8,
                    },
                }
            );
            expect(legend.fill).toBe('red');
            expect(legend.padding).toBe(10);
            expect(legend.cornerRadius).toBe(8);
            expect(legend.border).toMatchObject({ enabled: true, stroke: 'blue', strokeWidth: 2 });
        });

        it('applies the label params to the scale labels', () => {
            const legend = resolveGradientLegend(
                {},
                {
                    params: {
                        legendLabelColor: 'darkred',
                        legendLabelFontFamily: 'Georgia',
                        legendLabelFontSize: 14,
                        legendLabelFontWeight: 700,
                    },
                }
            );
            expect(legend.scale.label).toMatchObject({
                color: 'darkred',
                fontFamily: 'Georgia',
                fontSize: 14,
                fontWeight: 700,
            });
        });

        it('lets the gradient legend options beat the params', () => {
            const legend = resolveGradientLegend(
                { border: { enabled: false }, fill: 'green' },
                { params: { legendBorder: true, legendBackgroundColor: 'red' } }
            );
            expect(legend.border.enabled).toBe(false);
            expect(legend.fill).toBe('green');
        });
    });
});
