import { describe, expect, it } from 'vitest';

import {
    FILL_GRADIENT_BLANK_DEFAULTS,
    FILL_IMAGE_BLANK_DEFAULTS,
    FILL_PATTERN_BLANK_DEFAULTS,
    type InternalAgPatternColor,
    type RequiredInternalAgPatternColor,
} from 'ag-charts-core';

import { getShapeFill } from './shapeUtil';

describe('getShapeFill', () => {
    describe('pattern dimension fallback', () => {
        // Generic series resolution leaves the default pattern at 10x10, so the per-pattern
        // defaults must be reapplied on this fallback path (node/link fills reach it via getShapeStyle).
        const defaultPattern: RequiredInternalAgPatternColor = {
            ...FILL_PATTERN_BLANK_DEFAULTS,
            width: 10,
            height: 10,
        };

        const resolve = (fill: InternalAgPatternColor) =>
            getShapeFill(fill, FILL_GRADIENT_BLANK_DEFAULTS, defaultPattern, FILL_IMAGE_BLANK_DEFAULTS);

        it('defaults polka-dots to an 8x8 tile', () => {
            expect(resolve({ type: 'pattern', pattern: 'polka-dots' })).toMatchObject({ width: 8, height: 8 });
        });

        it('defaults waves to a 14x10 tile', () => {
            expect(resolve({ type: 'pattern', pattern: 'waves' })).toMatchObject({ width: 14, height: 10 });
        });

        it('leaves other patterns at the resolved default dimensions', () => {
            expect(resolve({ type: 'pattern', pattern: 'circles' })).toMatchObject({ width: 10, height: 10 });
        });

        it('respects explicit dimensions over the per-pattern default', () => {
            expect(resolve({ type: 'pattern', pattern: 'polka-dots', width: 20, height: 30 })).toMatchObject({
                width: 20,
                height: 30,
            });
        });
    });
});
