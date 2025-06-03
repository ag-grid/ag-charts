import { Caster } from 'ag-charts-test';
import type {
    AgBarSeriesOptions,
    AgBarSeriesThemeableOptions,
    AgBaseChartListeners,
    AgBaseChartOptions,
    AgBaseSeriesOptions,
    AgCartesianAxisOptions,
    AgChartLabelOptions,
    AgContextMenuItem,
} from 'ag-charts-types';

export type MockItemStyler = NonNullable<AgBarSeriesThemeableOptions['itemStyler']>;
export type MockAxisLabelFormatter = NonNullable<NonNullable<AgCartesianAxisOptions['label']>['formatter']>;
export type MockSeriesLabelFormatter = NonNullable<NonNullable<AgBarSeriesThemeableOptions['label']>['formatter']>;
export type MockTooltipRenderer = NonNullable<NonNullable<AgBarSeriesThemeableOptions['tooltip']>['renderer']>;
export type MockErrorBarStyler = NonNullable<NonNullable<AgBarSeriesOptions['errorBar']>['itemStyler']>;
export type MockChartLabelFormatter = NonNullable<NonNullable<AgChartLabelOptions<unknown, unknown>['formatter']>>;
export type MockZoomListener = NonNullable<AgBaseChartListeners<unknown>['zoom']>;
export type MockChartClickListener = NonNullable<AgBaseChartListeners<unknown>['click']>;
export type MockChartDblClickListener = NonNullable<AgBaseChartListeners<unknown>['doubleClick']>;
export type MockChartSeriesNodeClickListener = NonNullable<AgBaseChartListeners<unknown>['seriesNodeClick']>;
export type MockChartSeriesNodeDblClickListener = NonNullable<AgBaseChartListeners<unknown>['seriesNodeDoubleClick']>;
export type MockChartSeriesVisibilityChangeListener = NonNullable<
    AgBaseChartListeners<unknown>['seriesVisibilityChange']
>;
export type MockSeriesNodeClickListener = NonNullable<NonNullable<AgBaseSeriesOptions['listeners']>['seriesNodeClick']>;
export type MockSeriesNodeDblClickListener = NonNullable<
    NonNullable<AgBaseSeriesOptions['listeners']>['seriesNodeDoubleClick']
>;
export type MockLegendItemClickListener = NonNullable<
    NonNullable<NonNullable<AgBaseChartOptions['legend']>['listeners']>['legendItemClick']
>;
export type MockLegendItemDblClickListener = NonNullable<
    NonNullable<NonNullable<AgBaseChartOptions['legend']>['listeners']>['legendItemDoubleClick']
>;
export type MockContextMenuAction = NonNullable<Extract<AgContextMenuItem, object>['action']>;

export type MockAPICallback =
    | MockItemStyler
    | MockAxisLabelFormatter
    | MockSeriesLabelFormatter
    | MockTooltipRenderer
    | MockErrorBarStyler
    | MockChartLabelFormatter
    | MockZoomListener
    | MockChartClickListener
    | MockChartDblClickListener
    | MockChartSeriesNodeClickListener
    | MockChartSeriesNodeDblClickListener
    | MockChartSeriesVisibilityChangeListener
    | MockSeriesNodeClickListener
    | MockSeriesNodeDblClickListener
    | MockLegendItemClickListener
    | MockLegendItemDblClickListener
    | MockContextMenuAction;

// AG Charts calls Object.freeze on theme options, so we must create intermediate functions to circumvent that.
export function newFreezableMock<F extends MockAPICallback>(mockImp?: F) {
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
