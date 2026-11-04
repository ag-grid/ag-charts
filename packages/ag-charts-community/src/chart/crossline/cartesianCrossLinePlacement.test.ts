import { describe, expect, it } from 'vitest';

import type { CrossLineType } from 'ag-charts-core';

import { type CrossLinePlacementContext, resolveCrossLinePlacements } from './cartesianCrossLinePlacement';

function resolve(
    placement: string | string[] | undefined,
    {
        type = 'line',
        horizontal = true,
        rtl = false,
    }: Partial<{
        type: CrossLineType;
        horizontal: boolean;
        rtl: boolean;
    }> = {}
) {
    const warnings: string[] = [];
    const context: CrossLinePlacementContext = {
        type,
        horizontal,
        rtl,
        warn: (message) => warnings.push(message),
    };
    const anchors = resolveCrossLinePlacements(placement, context);
    return { anchors, warnings };
}

function anchorOf(placement: string, options?: Parameters<typeof resolve>[1]) {
    return resolve(placement, options).anchors[0];
}

describe('resolveCrossLinePlacements', () => {
    it('defaults to top when nothing is set', () => {
        expect(resolve(undefined).anchors).toEqual([anchorOf('top')]);
    });

    it('keeps every entry of an array in order', () => {
        expect(resolve(['right', 'left', 'inside']).anchors).toEqual([
            anchorOf('right'),
            anchorOf('left'),
            anchorOf('inside'),
        ]);
    });

    it('resolves start and end to left and right in a left-to-right chart', () => {
        expect(anchorOf('top-start')).toEqual(anchorOf('top-left'));
        expect(anchorOf('end')).toEqual(anchorOf('right'));
        expect(anchorOf('inside-start')).toEqual(anchorOf('inside-left'));
    });

    it('mirrors start and end in a right-to-left chart', () => {
        const rtl = { rtl: true };
        expect(anchorOf('top-start', rtl)).toEqual(anchorOf('top-right'));
        expect(anchorOf('end', rtl)).toEqual(anchorOf('left'));
        expect(anchorOf('inside-start', rtl)).toEqual(anchorOf('inside-right'));
    });

    it('never mirrors physical placements in a right-to-left chart', () => {
        expect(anchorOf('top-left', { rtl: true })).toEqual(anchorOf('top-left'));
    });

    it('resolves inside-start and inside-end along an x-axis line whatever the text direction', () => {
        for (const rtl of [false, true]) {
            const xLine = { horizontal: false, rtl };
            expect(anchorOf('inside-start', xLine)).toEqual(anchorOf('inside-top', { horizontal: false }));
            expect(anchorOf('inside-end', xLine)).toEqual(anchorOf('inside-bottom', { horizontal: false }));
        }
    });

    it('mirrors start and end on a range in a right-to-left chart', () => {
        const rtlRange = { type: 'range' as const, rtl: true };
        expect(anchorOf('inside-top-start', rtlRange)).toEqual(anchorOf('inside-top-right', { type: 'range' }));
        expect(anchorOf('inside-start', rtlRange)).toEqual(anchorOf('inside-right', { type: 'range' }));
    });

    it.each([
        [true, 'inside-top'],
        [true, 'inside-bottom-left'],
        [false, 'inside-left'],
        [false, 'top-right'],
        [false, 'top-start'],
    ])('ignores a placement that applies only to a range on a horizontal=%s line: %s', (horizontal, placement) => {
        const { anchors, warnings } = resolve(placement, { horizontal });
        expect(anchors).toEqual([anchorOf('top', { horizontal })]);
        expect(warnings).toEqual([
            expect.stringMatching(
                new RegExp(
                    `^Placement \`${placement}\` does not apply to a line cross line on ${horizontal ? 'a y' : 'an x'} axis and is ignored;`
                )
            ),
        ]);
    });

    it('ignores a placement that does not apply, listing the ones that do', () => {
        const { anchors, warnings } = resolve(['left-top', 'right'], { horizontal: true });
        expect(anchors).toEqual([anchorOf('right')]);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toMatch(
            /^Placement `left-top` does not apply to a line cross line on a y axis and is ignored; expecting one of /
        );
        const valid = warnings[0].split('expecting one of ')[1];
        expect(valid).toContain('`inside-start`');
        expect(valid).not.toContain('`left-top`');
    });

    it('falls back to top when every placement is ignored', () => {
        const { anchors, warnings } = resolve(['left-top'], { horizontal: true });
        expect(anchors).toEqual([anchorOf('top')]);
        expect(warnings).toHaveLength(1);
    });

    it('keeps inside valid on a line, centred on it', () => {
        const { anchors, warnings } = resolve('inside');
        expect(anchors).toEqual([{ rangeH: 0, rangeV: 0, labelH: 0, labelV: 0 }]);
        expect(warnings).toEqual([]);
    });

    it('accepts every range placement on a range', () => {
        const { warnings } = resolve(['left-top', 'top-left', 'inside-top-left', 'inside-bottom-end', 'inside-start'], {
            type: 'range',
            horizontal: false,
        });
        expect(warnings).toEqual([]);
    });
});
