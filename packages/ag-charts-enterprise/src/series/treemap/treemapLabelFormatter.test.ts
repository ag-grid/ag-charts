import { _Scene } from 'ag-charts-community';

import {
    formatSingleLabel,
    formatStackedLabels,
    generateLabelSecondaryLabelFontSizeCandidates,
    maximumValueSatisfying,
} from './treemapLabelFormatter';

const { Text } = _Scene;

describe('treeMapLabelFormatter', () => {
    let wrap: jest.SpyInstance<ReturnType<typeof Text.wrap>, Parameters<typeof Text.wrap>> = undefined!;
    let computeBBox: jest.SpyInstance<
        ReturnType<typeof Text.prototype.computeBBox>,
        Parameters<typeof Text.prototype.computeBBox>
    > = undefined!;

    beforeEach(() => {
        wrap = jest.spyOn(Text, 'wrap');
        computeBBox = jest.spyOn(Text.prototype, 'computeBBox');
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('generateLabelSecondaryLabelFontSizeCandidates', () => {
        it('creates a font scale', () => {
            expect(
                generateLabelSecondaryLabelFontSizeCandidates(
                    // @ts-expect-error Fix typechecking here
                    { fontSize: 12, minimumFontSize: 9 },
                    { fontSize: 10, minimumFontSize: 9 }
                )
            ).toEqual([
                { labelFontSize: 9, secondaryLabelFontSize: 9 },
                { labelFontSize: 10, secondaryLabelFontSize: 9 },
                { labelFontSize: 11, secondaryLabelFontSize: 9 },
                { labelFontSize: 12, secondaryLabelFontSize: 9 },
                { labelFontSize: 12, secondaryLabelFontSize: 10 },
            ]);
        });

        it('prefers shrinking secondary label', () => {
            expect(
                generateLabelSecondaryLabelFontSizeCandidates(
                    // @ts-expect-error Fix typechecking here
                    { fontSize: 10, minimumFontSize: 9 },
                    { fontSize: 10, minimumFontSize: 9 }
                )
            ).toEqual([
                { labelFontSize: 9, secondaryLabelFontSize: 9 },
                { labelFontSize: 10, secondaryLabelFontSize: 9 },
                { labelFontSize: 10, secondaryLabelFontSize: 10 },
            ]);

            expect(
                generateLabelSecondaryLabelFontSizeCandidates(
                    // @ts-expect-error Fix typechecking here
                    { fontSize: 11, minimumFontSize: 8 },
                    { fontSize: 10, minimumFontSize: 9 }
                )
            ).toEqual([
                { labelFontSize: 8, secondaryLabelFontSize: 9 },
                { labelFontSize: 9, secondaryLabelFontSize: 9 },
                { labelFontSize: 10, secondaryLabelFontSize: 9 },
                { labelFontSize: 11, secondaryLabelFontSize: 9 },
                { labelFontSize: 11, secondaryLabelFontSize: 10 },
            ]);

            expect(
                generateLabelSecondaryLabelFontSizeCandidates(
                    // @ts-expect-error Fix typechecking here
                    { fontSize: 10, minimumFontSize: 9 },
                    { fontSize: 11, minimumFontSize: 8 }
                )
            ).toEqual([
                { labelFontSize: 9, secondaryLabelFontSize: 8 },
                { labelFontSize: 9, secondaryLabelFontSize: 9 },
                { labelFontSize: 9, secondaryLabelFontSize: 10 },
                { labelFontSize: 10, secondaryLabelFontSize: 10 },
                { labelFontSize: 10, secondaryLabelFontSize: 11 },
            ]);
        });
    });

    describe('maximumValueSatisfying', () => {
        it('finds the minimum value', () => {
            expect(maximumValueSatisfying(0, 10, (x) => (x === 0 ? x : undefined))).toBe(0);
        });

        it('finds the maximum value', () => {
            expect(maximumValueSatisfying(0, 10, (x) => x)).toBe(10);
        });

        it('finds a middle value', () => {
            expect(maximumValueSatisfying(0, 10, (x) => (x <= 7 ? x : undefined))).toBe(7);
            expect(maximumValueSatisfying(0, 10, (x) => (x <= 2 ? x : undefined))).toBe(2);
        });
    });

    describe('formatSingleLabel', () => {
        it('formats a label without shrinking within large bounds', () => {
            wrap.mockImplementation((text) => text);
            computeBBox.mockImplementation(function (this: _Scene.Text) {
                return { width: this.fontSize, height: this.fontSize };
            });

            const format = formatSingleLabel(
                'Hello',
                // @ts-expect-error Fix typechecking here
                { fontSize: 20, minimumFontSize: 10, wrapping: 'never', overflow: 'never' },
                { padding: 10, spacing: 10 },
                () => ({ width: 1000, height: 1000 })
            );
            expect(format).toEqual({
                label: {
                    text: 'Hello',
                    fontSize: 20,
                    width: 20,
                    height: 20,
                },
                secondaryLabel: undefined,
            });
        });

        it('shrinks a label to fit within smaller bounds', () => {
            wrap.mockImplementation((text) => text);
            computeBBox.mockImplementation(function (this: _Scene.Text) {
                return { width: this.fontSize, height: this.fontSize };
            });

            const format = formatSingleLabel(
                'Hello',
                // @ts-expect-error Fix typechecking here
                { fontSize: 20, minimumFontSize: 10, wrapping: 'never', overflow: 'never' },
                { padding: 10, spacing: 10 },
                () => ({ width: 35, height: 35 })
            );
            expect(format).toEqual({
                label: {
                    text: 'Hello',
                    fontSize: 15,
                    width: 15,
                    height: 15,
                },
                secondaryLabel: undefined,
            });
        });
    });

    describe('formatStackedLabels', () => {
        it('formats stacked labels without shrinking within large bounds', () => {
            wrap.mockImplementation((text) => text);
            computeBBox.mockImplementation(function (this: _Scene.Text) {
                return { width: this.fontSize, height: this.fontSize };
            });

            const format = formatStackedLabels(
                'Hello',
                // @ts-expect-error Fix typechecking here
                { fontSize: 20, minimumFontSize: 10, wrapping: 'never', overflow: 'never' },
                'World',
                { fontSize: 10, minimumFontSize: 5, wrapping: 'never', overflow: 'never' },
                { padding: 10, spacing: 10 },
                () => ({ width: 1000, height: 1000 })
            );
            expect(format).toEqual({
                label: {
                    text: 'Hello',
                    fontSize: 20,
                    width: 20,
                    height: 20,
                },
                secondaryLabel: {
                    text: 'World',
                    fontSize: 10,
                    width: 10,
                    height: 10,
                },
            });
        });

        it('shrinks stacked labels to fit within smaller bounds', () => {
            wrap.mockImplementation((text) => text);
            computeBBox.mockImplementation(function (this: _Scene.Text) {
                return { width: this.fontSize, height: this.fontSize };
            });

            const height = 50;
            const padding = 10;
            const spacing = 10;

            const format = formatStackedLabels(
                'Hello',
                // @ts-expect-error Fix typechecking here
                { fontSize: 20, minimumFontSize: 10, wrapping: 'never', overflow: 'never' },
                'World',
                { fontSize: 10, minimumFontSize: 5, wrapping: 'never', overflow: 'never' },
                { padding, spacing },
                () => ({ width: 50, height })
            );
            expect(format).toEqual({
                label: {
                    text: 'Hello',
                    fontSize: 14,
                    width: 14,
                    height: 14,
                },
                secondaryLabel: {
                    text: 'World',
                    fontSize: 6,
                    width: 6,
                    height: 6,
                },
            });
            expect(padding + format!.label.height + spacing + format!.secondaryLabel!.height + padding).toBe(height);
        });
    });
});
