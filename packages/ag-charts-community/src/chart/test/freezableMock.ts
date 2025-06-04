import { Caster } from 'ag-charts-test';
import type {
    AgBarSeriesOptions,
    AgBarSeriesThemeableOptions,
    AgBaseChartListeners,
    AgBaseChartOptions,
    AgBaseSeriesOptions,
    AgBaseThemeableChartOptions,
    AgCartesianAxisOptions,
    AgChartLabelOptions,
    AgContextMenuItem,
} from 'ag-charts-types';

export type MockItemStyler<TDatum, _TContext> = NonNullable<AgBarSeriesThemeableOptions<TDatum>['itemStyler']>;
export type MockAxisLabelFormatter<_TDatum, TContext> = NonNullable<
    NonNullable<AgCartesianAxisOptions<TContext>['label']>['formatter']
>;
export type MockSeriesLabelFormatter<TDatum, _TContext> = NonNullable<
    NonNullable<AgBarSeriesThemeableOptions<TDatum>['label']>['formatter']
>;
export type MockTooltipRenderer<TDatum, _TContext> = NonNullable<
    NonNullable<AgBarSeriesThemeableOptions<TDatum>['tooltip']>['renderer']
>;
export type MockErrorBarStyler<TDatum, TContext> = NonNullable<
    NonNullable<AgBarSeriesOptions<TDatum, TContext>['errorBar']>['itemStyler']
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
export type MockSeriesNodeClickListener<TDatum, TContext> = NonNullable<
    NonNullable<AgBaseSeriesOptions<TDatum, TContext>['listeners']>['seriesNodeClick']
>;
export type MockSeriesNodeDblClickListener<TDatum, TContext> = NonNullable<
    NonNullable<AgBaseSeriesOptions<TDatum, TContext>['listeners']>['seriesNodeDoubleClick']
>;
export type MockLegendItemClickListener<TDatum, TContext> = NonNullable<
    NonNullable<NonNullable<AgBaseChartOptions<TDatum, TContext>['legend']>['listeners']>['legendItemClick']
>;
export type MockLegendItemDblClickListener<TDatum, TContext> = NonNullable<
    NonNullable<NonNullable<AgBaseChartOptions<TDatum, TContext>['legend']>['listeners']>['legendItemDoubleClick']
>;
export type MockContextMenuAction<TDatum, _TContext> = NonNullable<
    Extract<AgContextMenuItem<TDatum>, object>['action']
>;

export type MockAPICallback<TDatum, TContext> =
    | MockItemStyler<TDatum, TContext>
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
    | MockContextMenuAction<TDatum, TContext>;

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
