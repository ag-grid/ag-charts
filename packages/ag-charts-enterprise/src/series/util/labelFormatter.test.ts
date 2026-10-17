import {
    formatSingleLabel,
    formatStackedLabels,
    generateLabelSecondaryLabelFontSizeCandidates,
} from './labelFormatter';

// NOTE: We are rounding line heights in tests because while the browser font-height is always an integer,
// in node-canvas it is a float due to the legacy text measurement implementation. (emHeightAscent/emHeightDescent)

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

        it('lands the last step exactly on a fractional minimum', () => {
            expect(
                generateLabelSecondaryLabelFontSizeCandidates(
                    { fontSize: 12, minimumFontSize: 9.5 },
                    { fontSize: 10, minimumFontSize: 10 }
                )
            ).toEqual([
                { labelFontSize: 9.5, secondaryLabelFontSize: 10 },
                { labelFontSize: 10, secondaryLabelFontSize: 10 },
                { labelFontSize: 11, secondaryLabelFontSize: 10 },
                { labelFontSize: 12, secondaryLabelFontSize: 10 },
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
                    truncate: false,
                },
                { padding: 10 },
                () => ({ width: 1000, height: 1000, meta: undefined })
            )!;
            expect(Math.round(format.lineHeight)).toEqual(23);
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
                    truncate: false,
                },
                { padding: 5 },
                () => ({ width: 40, height: 40, meta: undefined })
            )!;
            expect(Math.round(format.lineHeight)).toEqual(15);
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
                    truncate: false,
                },
                { padding: 10 },
                () => ({ width: 1000, height: 1000, meta: undefined })
            )!;
            expect(Math.round(format.lineHeight)).toEqual(23);
        });

        it('bottoms out on a fractional minimumFontSize, truncating there', () => {
            const [format] = formatSingleLabel(
                'Hello',
                {
                    enabled: true,
                    fontFamily: 'Verdana',
                    fontSize: 20,
                    minimumFontSize: 10.5,
                    wrapping: 'never',
                    truncate: true,
                },
                { padding: 5 },
                () => ({ width: 20, height: 40, meta: undefined })
            )!;
            // Too narrow for 'Hello' whole at any size, so the floor is where the ellipsis takes over —
            // a whole-size-only search would settle at 10 instead, below the size asked for.
            expect(format.fontSize).toBe(10.5);
            expect(format.text).toContain('…');
        });

        it('shrinks manually broken lines that do not wrap until they all fit', () => {
            const [format] = formatSingleLabel(
                'Fresh\nfruit',
                {
                    enabled: true,
                    fontFamily: 'Verdana',
                    fontSize: 16,
                    minimumFontSize: 6,
                    wrapping: 'never',
                    truncate: true,
                },
                { padding: 0 },
                () => ({ width: 1000, height: 20, meta: undefined })
            )!;
            expect(format.text).toBe('Fresh\nfruit');
            expect(format.height).toBeLessThanOrEqual(20);
        });
    });

    describe('formatSingleLabel with an explicit lineHeight', () => {
        it('sizes the label by the lineHeight it is drawn with', () => {
            const [format] = formatSingleLabel(
                'Hello world',
                {
                    enabled: true,
                    fontFamily: 'Verdana',
                    fontSize: 12,
                    lineHeight: 30,
                    wrapping: 'on-space',
                    overflowStrategy: 'ellipsis',
                },
                { padding: 0 },
                () => ({ width: 50, height: 1000, meta: undefined })
            )!;
            expect(String(format.text).split('\n')).toHaveLength(2);
            expect(format.height).toBe(60);
        });

        it('truncates to the lines that fit at the lineHeight', () => {
            const [format] = formatSingleLabel(
                'Alpha\nBravo',
                {
                    enabled: true,
                    fontFamily: 'Verdana',
                    fontSize: 20,
                    minimumFontSize: 20,
                    lineHeight: 40,
                    maxHeight: 50,
                    wrapping: 'on-space',
                    truncate: true,
                },
                { padding: 0 },
                () => ({ width: 1000, height: 1000, meta: undefined })
            )!;
            expect(String(format.text).split('\n')).toHaveLength(1);
            expect(format.height).toBe(40);
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
                    truncate: false,
                    spacing: 10,
                },
                'World',
                {
                    enabled: true,
                    fontFamily: 'Verdana',
                    fontSize: 10,
                    minimumFontSize: 5,
                    wrapping: 'never',
                    truncate: false,
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
                    truncate: false,
                    spacing,
                },
                'World',
                {
                    enabled: true,
                    fontFamily: 'Verdana',
                    fontSize: 10,
                    minimumFontSize: 5,
                    wrapping: 'never',
                    truncate: false,
                },
                { padding },
                () => ({ width: 50, height, meta: undefined })
            );
            expect(format).toMatchSnapshot();
            expect(
                Math.round(padding + format!.label!.height + spacing + format!.secondaryLabel!.height + padding)
            ).toBe(height);
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
                    truncate: false,
                    spacing: 10,
                },
                'World',
                {
                    enabled: true,
                    fontFamily: 'Verdana',
                    fontSize: 10,
                    minimumFontSize: 20,
                    wrapping: 'never',
                    truncate: false,
                },
                { padding: 10 },
                () => ({ width: 1000, height: 1000, meta: undefined })
            );
            expect(format).toMatchSnapshot();
        });
    });
});
