import { Caster } from 'ag-charts-test';
import type { AgBarSeriesOptions, AgBarSeriesThemeableOptions } from 'ag-charts-types';

export type MockItemStyler = NonNullable<AgBarSeriesThemeableOptions['itemStyler']>;
export type MockLabelFormatter = NonNullable<NonNullable<AgBarSeriesThemeableOptions['label']>['formatter']>;
export type MockTooltipRenderer = NonNullable<NonNullable<AgBarSeriesThemeableOptions['tooltip']>['renderer']>;
export type MockErrorBarStyler = NonNullable<NonNullable<AgBarSeriesOptions['errorBar']>['itemStyler']>;

type APICallback = MockItemStyler | MockLabelFormatter | MockTooltipRenderer | MockErrorBarStyler;

// AG Charts calls Object.freeze on theme options, so we must create intermediate functions to circumvent that.
export function newFreezableMock<F extends APICallback>(mockImp?: F) {
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
                toHaveBeenCalledTimes(expected: number) {
                    expect(mock).toHaveBeenCalledTimes(expected);
                    return this;
                },
                nthCalledWithContext(nthCall: number, expected: unknown) {
                    const actual = getCallContext(mock.mock.calls[nthCall]);
                    expect(actual).toBe(expected); // `toBe` is intentional. The `context` must not be cloned
                    return this;
                },
                withContext(expected: unknown) {
                    for (const args of mock.mock.calls) {
                        const actual = getCallContext(args);
                        expect(actual).toBe(expected); // `toBe` is intentional. The `context` must not be cloned
                    }
                    return this;
                },
            };
        },
    };
}
