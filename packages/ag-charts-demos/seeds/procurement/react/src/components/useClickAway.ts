import { useEffect } from 'react';

/**
 * What a click can land on without clearing a selection: controls act on their own, a grid header
 * sorts, and a region marked `data-keeps-selection` handles the click itself — a chart clears its
 * own selection on a click on its empty space, and a grid of the selected lines is being worked through.
 */
const KEEPS_SELECTION = [
    'a',
    'button',
    'input',
    'select',
    'textarea',
    'label',
    '[role="button"]',
    '[role="checkbox"]',
    '[role="combobox"]',
    '[role="dialog"]',
    '[role="listbox"]',
    '[role="menuitem"]',
    '[role="option"]',
    '[role="radio"]',
    '[role="tab"]',
    '.ag-header',
    '[data-keeps-selection]',
].join(', ');

/**
 * Calls `onClear` on a click anywhere else on the page while `active`. Ctrl/Cmd-click adds to a
 * selection, so it never clears one.
 */
export function useClickAway(active: boolean, onClear: () => void) {
    useEffect(() => {
        if (!active) return;
        const onClick = (event: MouseEvent) => {
            if (event.ctrlKey || event.metaKey) return;
            if (event.target instanceof Element && event.target.closest(KEEPS_SELECTION) != null) return;
            onClear();
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, [active, onClear]);
}
