import { _ModuleSupport, _Scene } from 'ag-charts-community';

import {
    formatLabels,
    formatSingleLabel,
    formatStackedLabels,
    generateLabelSecondaryLabelFontSizeCandidates,
    maximumValueSatisfying,
} from './labelFormatter';

const { wrapLines: _wrapLines } = _ModuleSupport;
const { Text } = _Scene;

describe('label formatter', () => {
    const wrapLines: jest.SpyInstance<ReturnType<typeof _wrapLines>, Parameters<typeof _wrapLines>> = undefined!;
    let computeBBox: jest.SpyInstance<
        ReturnType<typeof Text.prototype.computeBBox>,
        Parameters<typeof Text.prototype.computeBBox>
    > = undefined!;

    beforeEach(() => {
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
            wrapLines.mockImplementation((text) => ({ lines: [text], truncated: false }));
            computeBBox.mockImplementation(function (this: _Scene.Text) {
                return { width: this.fontSize, height: this.fontSize } as _Scene.BBox;
            });

            const [format] = formatSingleLabel(
                'Hello',
                // @ts-expect-error Fix typechecking here
                {
                    enabled: true,
                    fontSize: 20,
                    minimumFontSize: 10,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                    spacing: 10,
                },
                { padding: 10 },
                () => ({ width: 1000, height: 1000 })
            )!;
            expect(format).toEqual({
                text: 'Hello',
                fontSize: 20,
                lineHeight: 23,
                width: 20,
                height: 23,
            });
        });

        it('shrinks a label to fit within smaller bounds', () => {
            wrapLines.mockImplementation((text) => ({ lines: [text], truncated: false }));
            computeBBox.mockImplementation(function (this: _Scene.Text) {
                return { width: this.fontSize, height: this.fontSize } as _Scene.BBox;
            });

            const [format] = formatSingleLabel(
                'Hello',
                // @ts-expect-error Fix typechecking here
                {
                    enabled: true,
                    fontSize: 20,
                    minimumFontSize: 10,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                    spacing: 10,
                },
                { padding: 10 },
                () => ({ width: 35, height: 35 })
            )!;
            expect(format).toEqual({
                text: 'Hello',
                fontSize: 13,
                lineHeight: 15,
                width: 13,
                height: 15,
            });
        });

        it('ignores minimumFontSizes greater than fontSize', () => {
            wrapLines.mockImplementation((text) => ({ lines: [text], truncated: false }));
            computeBBox.mockImplementation(function (this: _Scene.Text) {
                return { width: this.fontSize, height: this.fontSize } as _Scene.BBox;
            });

            const [format] = formatSingleLabel(
                'Hello',
                // @ts-expect-error Fix typechecking here
                {
                    enabled: true,
                    fontSize: 20,
                    minimumFontSize: 30,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                },
                { padding: 10, spacing: 10 },
                () => ({ width: 1000, height: 1000 })
            )!;
            expect(format).toEqual({
                text: 'Hello',
                fontSize: 20,
                lineHeight: 23,
                width: 20,
                height: 23,
            });
        });
    });

    describe('formatStackedLabels', () => {
        it('formats stacked labels without shrinking within large bounds', () => {
            wrapLines.mockImplementation((text) => ({ lines: [text], truncated: false }));
            computeBBox.mockImplementation(function (this: _Scene.Text) {
                return { width: this.fontSize, height: this.fontSize } as _Scene.BBox;
            });

            const format = formatStackedLabels(
                'Hello',
                // @ts-expect-error Fix typechecking here
                {
                    enabled: true,
                    fontSize: 20,
                    minimumFontSize: 10,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                    spacing: 10,
                },
                'World',
                {
                    enabled: true,
                    fontSize: 10,
                    minimumFontSize: 5,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                },
                { padding: 10 },
                () => ({ width: 1000, height: 1000 })
            );
            expect(format).toEqual({
                width: 20,
                height: 45,
                label: {
                    text: 'Hello',
                    fontSize: 20,
                    lineHeight: 23,
                    width: 20,
                    height: 23,
                },
                secondaryLabel: {
                    text: 'World',
                    fontSize: 10,
                    lineHeight: 12,
                    width: 10,
                    height: 12,
                },
            });
        });

        it('shrinks stacked labels to fit within smaller bounds', () => {
            wrapLines.mockImplementation((text) => ({ lines: [text], truncated: false }));
            computeBBox.mockImplementation(function (this: _Scene.Text) {
                return { width: this.fontSize, height: this.fontSize } as _Scene.BBox;
            });

            const height = 50;
            const padding = 10;
            const spacing = 10;

            const format = formatStackedLabels(
                'Hello',
                // @ts-expect-error Fix typechecking here
                {
                    enabled: true,
                    fontSize: 20,
                    minimumFontSize: 10,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                    spacing,
                },
                'World',
                {
                    enabled: true,
                    fontSize: 10,
                    minimumFontSize: 5,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                },
                { padding },
                () => ({ width: 50, height })
            );
            expect(format).toEqual({
                width: 12,
                height: 30,
                label: {
                    text: 'Hello',
                    fontSize: 12,
                    lineHeight: 14,
                    width: 12,
                    height: 14,
                },
                secondaryLabel: {
                    text: 'World',
                    fontSize: 5,
                    lineHeight: 6,
                    width: 5,
                    height: 6,
                },
            });
            expect(padding + format!.label!.height + spacing + format!.secondaryLabel!.height + padding).toBe(height);
        });

        it('ignores minimumFontSizes greater than fontSize', () => {
            wrapLines.mockImplementation((text) => ({ lines: [text], truncated: false }));
            computeBBox.mockImplementation(function (this: _Scene.Text) {
                return { width: this.fontSize, height: this.fontSize } as _Scene.BBox;
            });

            const format = formatStackedLabels(
                'Hello',
                // @ts-expect-error Fix typechecking here
                {
                    enabled: true,
                    fontSize: 20,
                    minimumFontSize: 30,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                    spacing: 10,
                },
                'World',
                {
                    enabled: true,
                    fontSize: 10,
                    minimumFontSize: 20,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                },
                { padding: 10 },
                () => ({ width: 1000, height: 1000 })
            );
            expect(format).toEqual({
                width: 20,
                height: 45,
                label: {
                    text: 'Hello',
                    fontSize: 20,
                    lineHeight: 23,
                    width: 20,
                    height: 23,
                },
                secondaryLabel: {
                    text: 'World',
                    fontSize: 10,
                    lineHeight: 12,
                    width: 10,
                    height: 12,
                },
            });
        });
    });

    describe('formatLabels', () => {
        it('formats the secondaryLabel on its own if and only if the primary label is not present', () => {
            wrapLines.mockImplementation((text) => ({ lines: [text], truncated: false }));
            computeBBox.mockImplementation(function (this: _Scene.Text) {
                return { width: 1, height: 1 } as _Scene.BBox;
            });

            const output = formatLabels(
                undefined,
                // @ts-expect-error Fix typechecking here
                {
                    enabled: true,
                    fontSize: 20,
                    minimumFontSize: 10,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                    spacing: 10,
                },
                'World',
                {
                    enabled: true,
                    fontSize: 10,
                    minimumFontSize: 5,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                },
                { padding: 10 },
                () => ({ width: Infinity, height: Infinity })
            );

            expect(output!.label).toBe(undefined);
            expect(output!.secondaryLabel).not.toBe(undefined);
        });
    });
});
