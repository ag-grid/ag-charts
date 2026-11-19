import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '../logging/logger';
import { hasToolbarButtonAccessibleName, warnUnnamedToolbarButtons } from './toolbarButtonAccessibleName';

describe('toolbarButtonAccessibleName', () => {
    describe('hasToolbarButtonAccessibleName', () => {
        it.each([
            ['ariaLabel only', { ariaLabel: 'Zoom in' }, true],
            ['tooltip only', { tooltip: 'Zoom in' }, true],
            ['label only', { label: '1M' }, true],
            ['blank ariaLabel with a tooltip', { ariaLabel: '  ', tooltip: 'Zoom in' }, true],
            ['empty ariaLabel', { ariaLabel: '' }, true],
            ['whitespace-only label', { label: ' ' }, true],
            ['no name fields', { icon: 'zoom-in' }, false],
            ['undefined button', undefined, false],
        ])('%s => %s', (_name, button, expected) => {
            expect(hasToolbarButtonAccessibleName(button)).toBe(expected);
        });
    });

    describe('warnUnnamedToolbarButtons', () => {
        beforeEach(() => {
            vi.spyOn(console, 'warn').mockImplementation(() => void 0);
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('warns once for each unnamed button, naming its path, index and string value', () => {
            const logger = new Logger();
            const buttons = [{ tooltip: 'Named', value: 'a' }, { value: 'pan-left' }, { value: [0, 5] }];

            warnUnnamedToolbarButtons(logger, 'zoom.buttons.buttons', buttons);
            warnUnnamedToolbarButtons(logger, 'zoom.buttons.buttons', buttons);

            expect(vi.mocked(console.warn).mock.calls).toEqual([
                [
                    "AG Charts - `zoom.buttons.buttons[1]` (value 'pan-left') has no accessible name; set an `ariaLabel`, `tooltip` or `label` so that screen readers can announce it.",
                ],
                [
                    'AG Charts - `zoom.buttons.buttons[2]` has no accessible name; set an `ariaLabel`, `tooltip` or `label` so that screen readers can announce it.',
                ],
            ]);
        });
    });
});
