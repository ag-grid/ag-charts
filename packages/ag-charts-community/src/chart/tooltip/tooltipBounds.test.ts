import { describe, expect, it } from 'vitest';

import type { AgTooltipPlacement } from 'ag-charts-types';

import { type TooltipBoundsOpts, getTooltipBounds } from './tooltipBounds';

// Coverage for the directional `tooltip.position.offset` property, including `anchorTo: 'chart'`.

const TOOLTIP_SIZE = { width: 100, height: 50 };
const CANVAS_RECT = { width: 800, height: 600 };

const baseOpts = (overrides: Partial<TooltipBoundsOpts>): TooltipBoundsOpts => ({
    elementSize: TOOLTIP_SIZE,
    anchorTo: 'chart',
    placement: 'top',
    canvasX: 0,
    canvasY: 0,
    yOffset: 0,
    xOffset: 0,
    offset: 0,
    canvasRect: CANVAS_RECT,
    ...overrides,
});

describe('getTooltipBounds', () => {
    describe("anchorTo: 'chart' — offset pushes inward from the anchored edge", () => {
        const cases: Array<[AgTooltipPlacement, { top: number; left: number }]> = [
            ['top', { top: 20, left: 0 }],
            ['bottom', { top: -20, left: 0 }],
            ['left', { top: 0, left: 20 }],
            ['right', { top: 0, left: -20 }],
            ['top-left', { top: 20, left: 20 }],
            ['top-right', { top: 20, left: -20 }],
            ['bottom-left', { top: -20, left: 20 }],
            ['bottom-right', { top: -20, left: -20 }],
        ];

        it.each(cases)('offset: 20 with placement: %s shifts tooltip inward', (placement, expected) => {
            const zero = getTooltipBounds(baseOpts({ placement, offset: 0 }));
            const shifted = getTooltipBounds(baseOpts({ placement, offset: 20 }));
            expect(shifted.top! - zero.top!).toBeCloseTo(expected.top);
            expect(shifted.left! - zero.left!).toBeCloseTo(expected.left);
        });

        // Explicit coverage of David's reported scenario: the default offset with placement 'top'
        // must place the tooltip inside the top edge, not flush against y=0.
        it("default offset of 12 places tooltip 12px inside 'top' edge", () => {
            const bounds = getTooltipBounds(baseOpts({ placement: 'top', offset: 12 }));
            expect(bounds.top).toBeCloseTo(12);
        });

        // Edge cases for corners — should account for offset on both axes.
        it("'top-right' with offset 12 sits 12px inside top edge and 12px inside right edge", () => {
            const bounds = getTooltipBounds(baseOpts({ placement: 'top-right', offset: 12 }));
            expect(bounds.top).toBeCloseTo(12);
            expect(bounds.left).toBeCloseTo(CANVAS_RECT.width - TOOLTIP_SIZE.width - 12);
        });

        // xOffset/yOffset continue to compose on top of `offset` (see ticket AC 7.3.2).
        it('composes with xOffset/yOffset in addition to directional offset', () => {
            const bounds = getTooltipBounds(baseOpts({ placement: 'top', offset: 12, xOffset: 5, yOffset: -2 }));
            expect(bounds.top).toBeCloseTo(12 - 2);
            expect(bounds.left).toBeCloseTo(CANVAS_RECT.width / 2 - TOOLTIP_SIZE.width / 2 + 5);
        });
    });

    describe("anchorTo: 'pointer' — offset pushes outward from the anchor point", () => {
        // Pointer/node anchoring uses the opposite sign to chart anchoring: the tooltip is pushed
        // AWAY from the pointer along the placement direction.

        it("placement: 'top' with offset: 12 sits 12px above the pointer", () => {
            const zero = getTooltipBounds(
                baseOpts({ anchorTo: 'pointer', placement: 'top', canvasX: 400, canvasY: 300, offset: 0 })
            );
            const shifted = getTooltipBounds(
                baseOpts({ anchorTo: 'pointer', placement: 'top', canvasX: 400, canvasY: 300, offset: 12 })
            );
            expect(shifted.top! - zero.top!).toBeCloseTo(-12);
            expect(shifted.left! - zero.left!).toBeCloseTo(0);
        });

        it("placement: 'right' with offset: 12 sits 12px right of the pointer", () => {
            const zero = getTooltipBounds(
                baseOpts({ anchorTo: 'pointer', placement: 'right', canvasX: 400, canvasY: 300, offset: 0 })
            );
            const shifted = getTooltipBounds(
                baseOpts({ anchorTo: 'pointer', placement: 'right', canvasX: 400, canvasY: 300, offset: 12 })
            );
            expect(shifted.top! - zero.top!).toBeCloseTo(0);
            expect(shifted.left! - zero.left!).toBeCloseTo(12);
        });
    });
});
