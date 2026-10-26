import { describe, expect, it } from 'vitest';

import { getToolbarIconSize } from './toolbarButtonWidget';

describe('getToolbarIconSize', () => {
    it('keeps the natural 20px icon at the default button size', () => {
        expect(getToolbarIconSize(34)).toBe(20);
        expect(getToolbarIconSize(24, 24)).toBe(20);
    });

    it.each([
        [10, 6],
        [44, 26],
        [45, 27],
        [60, 36],
    ])('scales the icon with a %spx button to %spx', (buttonSize, iconSize) => {
        expect(getToolbarIconSize(buttonSize)).toBe(iconSize);
    });

    it.each([10, 22.5, 33, 44, 44.4, 44.6, 47, 61.25])(
        'returns a whole-pixel icon with a whole-pixel inset for a %spx button',
        (buttonSize) => {
            const iconSize = getToolbarIconSize(buttonSize);
            expect(Number.isInteger(iconSize)).toBe(true);
            expect((Math.round(buttonSize) - iconSize) % 2).toBe(0);
        }
    );
});
