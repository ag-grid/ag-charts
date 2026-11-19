import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '../logging/logger';
import { hasToolbarButtonAccessibleName, warnUnnamedToolbarButtons } from './toolbarButtonAccessibleName';

describe('toolbarButtonAccessibleName', () => {
    const untranslated = { t: (key: string) => key };

    describe('hasToolbarButtonAccessibleName', () => {
        it.each([
            ['ariaLabel only', { ariaLabel: 'Zoom in' }, true],
            ['tooltip only', { tooltip: 'Zoom in' }, true],
            ['label only', { label: '1M' }, true],
            ['blank ariaLabel with a tooltip', { ariaLabel: '  ', tooltip: 'Zoom in' }, true],
            ['no name fields', { icon: 'zoom-in' }, false],
            ['empty strings', { ariaLabel: '', tooltip: '', label: '' }, false],
            ['whitespace only', { ariaLabel: '   ', tooltip: '\t\n', label: ' ' }, false],
            ['undefined button', undefined, false],
        ])('%s => %s', (_name, button, expected) => {
            expect(hasToolbarButtonAccessibleName(button, untranslated)).toBe(expected);
        });

        it('judges the translated text, so a key that resolves to blank is not a name', () => {
            const translator = { t: (key: string) => (key === 'emptyKey' ? ' ' : `[${key}]`) };
            expect(hasToolbarButtonAccessibleName({ tooltip: 'emptyKey' }, translator)).toBe(false);
            expect(hasToolbarButtonAccessibleName({ tooltip: 'emptyKey', label: 'otherKey' }, translator)).toBe(true);
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
            const buttons = [{ tooltip: 'Named', value: 'a' }, { value: 'pan-left' }, { label: ' ', value: [0, 5] }];

            warnUnnamedToolbarButtons(logger, untranslated, 'zoom.buttons.buttons', buttons);
            warnUnnamedToolbarButtons(logger, untranslated, 'zoom.buttons.buttons', buttons);

            expect(vi.mocked(console.warn).mock.calls).toEqual([
                [
                    "AG Charts - `zoom.buttons.buttons[1]` (value 'pan-left') has no accessible name; set a non-empty `ariaLabel`, `tooltip` or `label` so that screen readers can announce it.",
                ],
                [
                    'AG Charts - `zoom.buttons.buttons[2]` has no accessible name; set a non-empty `ariaLabel`, `tooltip` or `label` so that screen readers can announce it.',
                ],
            ]);
        });
    });
});
