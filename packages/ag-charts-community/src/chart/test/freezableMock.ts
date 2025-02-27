import { Caster } from 'ag-charts-test';
import type { AgBarSeriesThemeableOptions } from 'ag-charts-types';

export type MockItemStyler = NonNullable<AgBarSeriesThemeableOptions['itemStyler']>;
export type MockLabelFormatter = NonNullable<NonNullable<AgBarSeriesThemeableOptions['label']>['formatter']>;
export type MockTooltipRenderer = NonNullable<NonNullable<AgBarSeriesThemeableOptions['tooltip']>['renderer']>;

// AG Charts calls Object.freeze on theme options, so we must create intermediate functions to circumvent that.
export function newFreezableMock<F extends MockItemStyler | MockLabelFormatter | MockTooltipRenderer>(mockImp: F) {
    type Rtn = ReturnType<F>;
    type Arg = Parameters<F>[0];

    const mock: jest.Mock<Rtn, Arg[]> = jest.fn<any, any>(mockImp);
    return {
        mock,
        frozen: Object.freeze((params: Arg): Rtn => mock(params)),
        expect() {
            return {
                toHaveBeenCalledTimes(expected: number) {
                    expect(mock).toHaveBeenCalledTimes(expected);
                    return this;
                },
                withContext(expected: unknown) {
                    for (const args of mock.mock.calls) {
                        const callContext = new Caster(args[0]).findProperty('context').accessProperty('context').value;
                        expect(callContext).toBe(expected);
                    }
                    expect(Object.isFrozen(expected)).toBe(false);
                    return this;
                },
            };
        },
    };
}
