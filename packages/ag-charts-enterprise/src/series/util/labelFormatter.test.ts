import {
    formatLabels,
    formatSingleLabel,
    formatStackedLabels,
    generateLabelSecondaryLabelFontSizeCandidates,
} from './labelFormatter';

describe('label formatter', () => {
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
            const [format] = formatSingleLabel(
                'Hello',
                {
                    enabled: true,
                    fontFamily: 'Verdana',
                    fontSize: 20,
                    minimumFontSize: 10,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                },
                { padding: 10 },
                () => ({ width: 1000, height: 1000, meta: undefined })
            )!;
            expect(format.lineHeight).toEqual(23);
        });

        it('shrinks a label to fit within smaller bounds', () => {
            const [format] = formatSingleLabel(
                'Hello',
                {
                    enabled: true,
                    fontFamily: 'Verdana',
                    fontSize: 20,
                    minimumFontSize: 10,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                },
                { padding: 5 },
                () => ({ width: 40, height: 40, meta: undefined })
            )!;
            expect(format.lineHeight).toEqual(14);
        });

        it('ignores minimumFontSizes greater than fontSize', () => {
            const [format] = formatSingleLabel(
                'Hello',
                {
                    enabled: true,
                    fontFamily: 'Verdana',
                    fontSize: 20,
                    minimumFontSize: 30,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                },
                { padding: 10 },
                () => ({ width: 1000, height: 1000, meta: undefined })
            )!;
            expect(format.lineHeight).toEqual(23);
        });
    });

    describe('formatStackedLabels', () => {
        it('formats stacked labels without shrinking within large bounds', () => {
            const format = formatStackedLabels(
                'Hello',
                {
                    enabled: true,
                    fontFamily: 'Verdana',
                    fontSize: 20,
                    minimumFontSize: 10,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                    spacing: 10,
                },
                'World',
                {
                    enabled: true,
                    fontFamily: 'Verdana',
                    fontSize: 10,
                    minimumFontSize: 5,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                },
                { padding: 10 },
                () => ({ width: 1000, height: 1000, meta: undefined })
            );
            expect(format).toMatchSnapshot();
        });

        it('shrinks stacked labels to fit within smaller bounds', () => {
            const height = 50;
            const padding = 10;
            const spacing = 10;

            const format = formatStackedLabels(
                'Hello',
                {
                    enabled: true,
                    fontFamily: 'Verdana',
                    fontSize: 20,
                    minimumFontSize: 10,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                    spacing,
                },
                'World',
                {
                    enabled: true,
                    fontFamily: 'Verdana',
                    fontSize: 10,
                    minimumFontSize: 5,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                },
                { padding },
                () => ({ width: 50, height, meta: undefined })
            );
            expect(format).toMatchSnapshot();
            expect(padding + format!.label!.height + spacing + format!.secondaryLabel!.height + padding).toBe(height);
        });

        it('ignores minimumFontSizes greater than fontSize', () => {
            const format = formatStackedLabels(
                'Hello',
                {
                    enabled: true,
                    fontFamily: 'Verdana',
                    fontSize: 20,
                    minimumFontSize: 30,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                    spacing: 10,
                },
                'World',
                {
                    enabled: true,
                    fontFamily: 'Verdana',
                    fontSize: 10,
                    minimumFontSize: 20,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                },
                { padding: 10 },
                () => ({ width: 1000, height: 1000, meta: undefined })
            );
            expect(format).toMatchSnapshot();
        });
    });

    describe('formatLabels', () => {
        it('formats the secondaryLabel on its own if and only if the primary label is not present', () => {
            const output = formatLabels(
                undefined,
                {
                    enabled: true,
                    fontFamily: 'Verdana',
                    fontSize: 20,
                    minimumFontSize: 10,
                    wrapping: 'never',
                    overflowStrategy: 'hide',
                    spacing: 10,
                },
                'World',
                {
                    enabled: true,
                    fontFamily: 'Verdana',
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
