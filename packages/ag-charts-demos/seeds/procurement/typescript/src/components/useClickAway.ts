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

export interface ClickAway {
    /** The effect's `active` dependency: listens only while there is a selection to clear. */
    setActive(active: boolean): void;
    /** The effect's cleanup on unmount. */
    destroy(): void;
}

/**
 * The `useClickAway` hook: calls `onClear` on a click anywhere else on the page while active.
 * Ctrl/Cmd-click adds to a selection, so it never clears one.
 */
export function createClickAway(onClear: () => void): ClickAway {
    let active = false;
    const onClick = (event: MouseEvent) => {
        if (event.ctrlKey || event.metaKey) return;
        if (event.target instanceof Element && event.target.closest(KEEPS_SELECTION) != null) return;
        onClear();
    };
    return {
        setActive(next) {
            if (next === active) return;
            active = next;
            if (active) document.addEventListener('click', onClick);
            else document.removeEventListener('click', onClick);
        },
        destroy() {
            active = false;
            document.removeEventListener('click', onClick);
        },
    };
}
