import { _ModuleSupport, _Scene } from 'ag-charts-community';

import {
    formatLabels,
    formatSingleLabel,
    formatStackedLabels,
    generateLabelSecondaryLabelFontSizeCandidates,
} from './labelFormatter';

const { TextMeasurer } = _ModuleSupport;

describe('label formatter', () => {
    let wrapLines: jest.SpyInstance<
        ReturnType<typeof TextMeasurer.wrapLines>,
        Parameters<typeof TextMeasurer.wrapLines>
    > = undefined!;
    let measureLines: jest.SpyInstance<
        ReturnType<typeof TextMeasurer.measureLines>,
        Parameters<typeof TextMeasurer.measureLines>
    > = undefined!;

    beforeEach(() => {
        wrapLines = jest.spyOn(TextMeasurer, 'wrapLines');
        measureLines = jest.spyOn(TextMeasurer, 'measureLines');
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('generateLabelSecondaryLabelFontSizeCandidates', () => {
        it('creates a font scale', () => {
            expect(
                generateLabelSecondaryLabelFontSizeCandidates(
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

    describe('formatSingleLabel', () => {
        it('formats a label without shrinking within large bounds', () => {
            wrapLines.mockImplementation((text) => [text]);
            measureLines.mockImplementation(function (this: _Scene.Text) {
                return { width: this.fontSize, height: this.fontSize } as any;
            });

            const [format] = formatSingleLabel(
                'Hello',
                {
                    enabled: true,
                    fontSize: 20,
                    minimumFontSize: 10,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                },
                { padding: 10 },
                () => ({ width: 1000, height: 1000, meta: undefined })
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
            wrapLines.mockImplementation((text) => [text]);
            measureLines.mockImplementation(function (this: _Scene.Text) {
                return { width: this.fontSize, height: this.fontSize } as any;
            });

            const [format] = formatSingleLabel(
                'Hello',
                {
                    enabled: true,
                    fontSize: 20,
                    minimumFontSize: 10,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                },
                { padding: 10 },
                () => ({ width: 35, height: 35, meta: undefined })
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
            wrapLines.mockImplementation((text) => [text]);
            measureLines.mockImplementation(function (this: _Scene.Text) {
                return { width: this.fontSize, height: this.fontSize } as any;
            });

            const [format] = formatSingleLabel(
                'Hello',
                {
                    enabled: true,
                    fontSize: 20,
                    minimumFontSize: 30,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                },
                { padding: 10 },
                () => ({ width: 1000, height: 1000, meta: undefined })
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
            wrapLines.mockImplementation((text) => [text]);
            measureLines.mockImplementation(function (this: _Scene.Text) {
                return { width: this.fontSize, height: this.fontSize } as any;
            });

            const format = formatStackedLabels(
                'Hello',
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
                () => ({ width: 1000, height: 1000, meta: undefined })
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
            wrapLines.mockImplementation((text) => [text]);
            measureLines.mockImplementation(function (this: _Scene.Text) {
                return { width: this.fontSize, height: this.fontSize } as any;
            });

            const height = 50;
            const padding = 10;
            const spacing = 10;

            const format = formatStackedLabels(
                'Hello',
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
                () => ({ width: 50, height, meta: undefined })
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
            wrapLines.mockImplementation((text) => [text]);
            measureLines.mockImplementation(function (this: _Scene.Text) {
                return { width: this.fontSize, height: this.fontSize } as any;
            });

            const format = formatStackedLabels(
                'Hello',
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
                () => ({ width: 1000, height: 1000, meta: undefined })
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
            wrapLines.mockImplementation((text) => [text]);
            measureLines.mockImplementation(function (this: _Scene.Text) {
                return { width: 1, height: 1 } as any;
            });

            const output = formatLabels(
                undefined,
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
                () => ({ width: Infinity, height: Infinity, meta: undefined })
            );

            expect(output!.label).toBe(undefined);
            expect(output!.secondaryLabel).not.toBe(undefined);
        });
    });
});
