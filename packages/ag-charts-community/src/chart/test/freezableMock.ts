import type { NonNullablePath } from 'ag-charts-core';
import { Caster } from 'ag-charts-test';
import type {
    AgAreaSeriesThemeableOptions,
    AgBarSeriesOptions,
    AgBarSeriesThemeableOptions,
    AgBaseChartListeners,
    AgBaseChartOptions,
    AgBaseRadialSeriesThemeableOptions,
    AgBaseSeriesOptions,
    AgBaseThemeableChartOptions,
    AgBoxPlotSeriesThemeableOptions,
    AgBubbleSeriesThemeableOptions,
    AgCartesianAxisOptions,
    AgChartLabelOptions,
    AgChartOptions,
    AgContextMenuItem,
    AgDonutSeriesCalloutOptions,
    AgLineSeriesThemeableOptions,
    AgNightingaleSeriesThemeableOptions,
    AgPieSeriesCalloutOptions,
    AgRadarAreaSeriesOptions,
    AgRadarLineSeriesOptions,
    AgRadialColumnSeriesThemeableOptions,
    AgRangeAreaSeriesOptions,
    AgRangeBarSeriesOptions,
    AgScatterSeriesThemeableOptions,
} from 'ag-charts-types';

export type MockAreaStyler<TDatum, TContext> = NonNullable<AgAreaSeriesThemeableOptions<TDatum, TContext>['styler']>;
export type MockAreaItemStyler<TDatum, TContext> = NonNullablePath<
    AgAreaSeriesThemeableOptions<TDatum, TContext>,
    'marker',
    'itemStyler'
>;
export type MockBarStyler<TDatum, TContext> = NonNullable<AgBarSeriesThemeableOptions<TDatum, TContext>['styler']>;
export type MockBarItemStyler<TDatum, TContext> = NonNullable<
    AgBarSeriesThemeableOptions<TDatum, TContext>['itemStyler']
>;
export type MockBubbleStyler<TDatum, TContext> = NonNullable<
    AgBubbleSeriesThemeableOptions<TDatum, TContext>['styler']
>;
export type MockBubbleItemStyler<TDatum, TContext> = NonNullable<
    AgBubbleSeriesThemeableOptions<TDatum, TContext>['itemStyler']
>;
export type MockScatterStyler<TDatum, TContext> = NonNullable<
    AgScatterSeriesThemeableOptions<TDatum, TContext>['styler']
>;
export type MockScatterItemStyler<TDatum, TContext> = NonNullable<
    AgScatterSeriesThemeableOptions<TDatum, TContext>['itemStyler']
>;
export type MockLineStyler<TDatum, TContext> = NonNullable<AgLineSeriesThemeableOptions<TDatum, TContext>['styler']>;
export type MockLineMarkerItemStyler<TDatum, TContext> = NonNullablePath<
    AgLineSeriesThemeableOptions<TDatum, TContext>,
    'marker',
    'itemStyler'
>;
export type MockPieCalloutLineItemStyler<TDatum, TContext> = NonNullable<
    AgPieSeriesCalloutOptions<TDatum, TContext>['itemStyler']
>;
export type MockDonutCalloutLineItemStyler<TDatum, TContext> = NonNullable<
    AgDonutSeriesCalloutOptions<TDatum, TContext>['itemStyler']
>;
export type MockBoxPlotStyler<TDatum, TContext> = NonNullable<
    AgBoxPlotSeriesThemeableOptions<TDatum, TContext>['styler']
>;
export type MockBoxPlotItemStyler<TDatum, TContext> = NonNullable<
    AgBoxPlotSeriesThemeableOptions<TDatum, TContext>['itemStyler']
>;
type MockBaseRadialStyler<TDatum, TContext> = NonNullable<
    AgBaseRadialSeriesThemeableOptions<TDatum, TContext>['styler']
>;
type MockBaseRadialItemStyler<TDatum, TContext> = NonNullable<
    AgBaseRadialSeriesThemeableOptions<TDatum, TContext>['itemStyler']
>;
export type MockRadialColumnStyler<TDatum, TContext> = NonNullable<
    AgRadialColumnSeriesThemeableOptions<TDatum, TContext>['styler']
>;
export type MockRadialColumnItemStyler<TDatum, TContext> = NonNullable<
    AgRadialColumnSeriesThemeableOptions<TDatum, TContext>['itemStyler']
>;
export type MockNightingaleStyler<TDatum, TContext> = NonNullable<
    AgNightingaleSeriesThemeableOptions<TDatum, TContext>['styler']
>;
export type MockNightingaleItemStyler<TDatum, TContext> = NonNullable<
    AgNightingaleSeriesThemeableOptions<TDatum, TContext>['itemStyler']
>;
export type MockRadarLineStyler<TDatum, TContext> = NonNullable<AgRadarLineSeriesOptions<TDatum, TContext>['styler']>;
export type MockRadarAreaStyler<TDatum, TContext> = NonNullable<AgRadarAreaSeriesOptions<TDatum, TContext>['styler']>;
export type MockRangeBarStyler<TDatum, TContext> = NonNullable<AgRangeBarSeriesOptions<TDatum, TContext>['styler']>;
export type MockRangeAreaStyler<TDatum, TContext> = NonNullable<AgRangeAreaSeriesOptions<TDatum, TContext>['styler']>;
export type MockAxisLabelFormatter<_TDatum, TContext> = NonNullablePath<
    AgCartesianAxisOptions<TContext>,
    'label',
    'formatter'
>;
export type MockSeriesLabelFormatter<TDatum, TContext> = NonNullablePath<
    AgBarSeriesThemeableOptions<TDatum, TContext>,
    'label',
    'formatter'
>;
export type MockTooltipRenderer<TDatum, TContext> = NonNullablePath<
    AgBarSeriesThemeableOptions<TDatum, TContext>,
    'tooltip',
    'renderer'
>;
export type MockErrorBarStyler<TDatum, TContext> = NonNullablePath<
    AgBarSeriesOptions<TDatum, TContext>,
    'errorBar',
    'itemStyler'
>;
export type MockChartLabelFormatter<TDatum, TContext> = NonNullable<
    NonNullable<AgChartLabelOptions<TDatum, TContext>['formatter']>
>;
export type MockAnnotationsListener<TDatum, TContext> = NonNullable<
    AgBaseChartListeners<TDatum, TContext>['annotations']
>;
export type MockZoomListener<TDatum, TContext> = NonNullable<AgBaseChartListeners<TDatum, TContext>['zoom']>;
export type MockGetDataCallback<TDatum, TContext> = NonNullable<
    AgBaseThemeableChartOptions<TDatum, TContext>['dataSource']
>['getData'];
export type MockChartClickListener<TDatum, TContext> = NonNullable<AgBaseChartListeners<TDatum, TContext>['click']>;
export type MockChartDblClickListener<TDatum, TContext> = NonNullable<
    AgBaseChartListeners<TDatum, TContext>['doubleClick']
>;
export type MockChartSeriesVisibilityChangeListener<TDatum, TContext> = NonNullable<
    AgBaseChartListeners<TDatum, TContext>['seriesVisibilityChange']
>;
export type MockSeriesNodeClickListener<TDatum, TContext> = NonNullablePath<
    AgBaseSeriesOptions<TDatum, TContext>,
    'listeners',
    'seriesNodeClick'
>;
export type MockSeriesNodeDblClickListener<TDatum, TContext> = NonNullablePath<
    AgBaseSeriesOptions<TDatum, TContext>,
    'listeners',
    'seriesNodeDoubleClick'
>;
export type MockLegendItemClickListener<TDatum, TContext> = NonNullablePath<
    AgBaseChartOptions<TDatum, TContext>,
    'legend',
    'listeners',
    'legendItemClick'
>;
export type MockLegendItemDblClickListener<TDatum, TContext> = NonNullablePath<
    AgBaseChartOptions<TDatum, TContext>,
    'legend',
    'listeners',
    'legendItemDoubleClick'
>;
export type MockContextMenuAction<TDatum, TContext> = NonNullable<
    Extract<AgContextMenuItem<TDatum, TContext>, object>['action']
>;
export type MockOverlayRenderer<TDatum, TContext> = NonNullablePath<
    AgChartOptions<TDatum, TContext>,
    'overlays',
    'noData',
    'renderer'
>;
export type MockAPICallback<TDatum, TContext> =
    | MockAreaStyler<TDatum, TContext>
    | MockAreaItemStyler<TDatum, TContext>
    | MockBarStyler<TDatum, TContext>
    | MockBarItemStyler<TDatum, TContext>
    | MockBubbleStyler<TDatum, TContext>
    | MockBubbleItemStyler<TDatum, TContext>
    | MockScatterStyler<TDatum, TContext>
    | MockScatterItemStyler<TDatum, TContext>
    | MockLineStyler<TDatum, TContext>
    | MockLineMarkerItemStyler<TDatum, TContext>
    | MockPieCalloutLineItemStyler<TDatum, TContext>
    | MockDonutCalloutLineItemStyler<TDatum, TContext>
    | MockBoxPlotStyler<TDatum, TContext>
    | MockBoxPlotItemStyler<TDatum, TContext>
    | MockBaseRadialStyler<TDatum, TContext>
    | MockBaseRadialItemStyler<TDatum, TContext>
    | MockRadarLineStyler<TDatum, TContext>
    | MockRadarAreaStyler<TDatum, TContext>
    | MockRangeBarStyler<TDatum, TContext>
    | MockRangeAreaStyler<TDatum, TContext>
    | MockAxisLabelFormatter<TDatum, TContext>
    | MockSeriesLabelFormatter<TDatum, TContext>
    | MockTooltipRenderer<TDatum, TContext>
    | MockErrorBarStyler<TDatum, TContext>
    | MockChartLabelFormatter<TDatum, TContext>
    | MockAnnotationsListener<TDatum, TContext>
    | MockZoomListener<TDatum, TContext>
    | MockGetDataCallback<TDatum, TContext>
    | MockChartClickListener<TDatum, TContext>
    | MockChartDblClickListener<TDatum, TContext>
    | MockChartSeriesVisibilityChangeListener<TDatum, TContext>
    | MockSeriesNodeClickListener<TDatum, TContext>
    | MockSeriesNodeDblClickListener<TDatum, TContext>
    | MockLegendItemClickListener<TDatum, TContext>
    | MockLegendItemDblClickListener<TDatum, TContext>
    | MockContextMenuAction<TDatum, TContext>
    | MockOverlayRenderer<TDatum, TContext>;

// AG Charts calls Object.freeze on theme options, so we must create intermediate functions to circumvent that.
export function newFreezableMock<D, C, F extends MockAPICallback<D, C>>(mockImp?: F) {
    type Rtn = ReturnType<F>;
    type Arg = Parameters<F>[0];

    const mock: jest.Mock<Rtn, Arg[]> = jest.fn<any, any>(mockImp);
    function getCallContext(args: (typeof mock.mock.calls)[number]) {
        expect(args).toBeDefined();
        expect(args[0]).toBeDefined();
        return new Caster(args[0]).findProperty('context').accessProperty('context').value;
    }
    return {
        mock,
        frozen: Object.freeze((params: Arg): Rtn => mock(params)),
        expect() {
            return {
                mockClear() {
                    mock.mockClear();
                    return this;
                },
                toHaveBeenCalledTimes(expected: number) {
                    expect(mock).toHaveBeenCalledTimes(expected);
                    return this;
                },
                nthCalledWithContext(nthCall: number, expected: unknown) {
                    const actual = getCallContext(mock.mock.calls[nthCall]);
                    expect(actual).toBe(expected); // `toBe` is intentional. The `context` must not be cloned
                    return this;
                },
                nthCalledWithoutContext(nthCall: number) {
                    const args = mock.mock.calls[nthCall];
                    expect(args).toBeDefined();
                    expect(args[0]).toBeDefined();
                    expect(args[0]).not.toHaveProperty('context');
                    return this;
                },
                withContext(expected: unknown) {
                    for (const args of mock.mock.calls) {
                        const actual = getCallContext(args);
                        expect(actual).toBe(expected); // `toBe` is intentional. The `context` must not be cloned
                    }
                    return this;
                },
                withoutContext() {
                    for (const args of mock.mock.calls) {
                        expect(args).toBeDefined();
                        expect(args[0]).toBeDefined();
                        expect(args[0]).not.toHaveProperty('context');
                    }
                    return this;
                },
            };
        },
    };
}

export function newFreezableMockInferred<F extends MockAPICallback<any, any>>(mockImp?: F) {
    type D = F extends MockAPICallback<infer Di, unknown> ? Di : never;
    type C = F extends MockAPICallback<unknown, infer Ci> ? Ci : never;
    return newFreezableMock<D, C, F>(mockImp);
}
