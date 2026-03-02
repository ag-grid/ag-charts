import { entries } from 'ag-charts-core';

type KeyBinding = Readonly<{ key: string; ctrlOrMeta?: boolean; shift?: boolean } | { code: string }>;
type KeyActionConfig = Readonly<{ bindings: KeyBinding[]; activatesFocusIndicator?: boolean }>;
type KeyAction = { name: KeyActionName; activatesFocusIndicator: boolean };

type KeyActionName =
    | 'arrowdown'
    | 'arrowleft'
    | 'arrowright'
    | 'arrowup'
    | 'home'
    | 'end'
    | 'delete'
    | 'undo'
    | 'redo'
    | 'submit'
    | 'zoomin'
    | 'zoomout';

const KEY_BINDINGS: { [K in KeyActionName]: KeyActionConfig } = {
    arrowdown: { bindings: [{ code: 'ArrowDown' }] },
    arrowleft: { bindings: [{ code: 'ArrowLeft' }] },
    arrowright: { bindings: [{ code: 'ArrowRight' }] },
    arrowup: { bindings: [{ code: 'ArrowUp' }] },
    home: { bindings: [{ code: 'Home' }] },
    end: { bindings: [{ code: 'End' }] },
    delete: { bindings: [{ key: 'Backspace' }, { key: 'Delete' }], activatesFocusIndicator: false },
    redo: {
        bindings: [
            { key: 'y', ctrlOrMeta: true },
            { key: 'z', ctrlOrMeta: true, shift: true },
        ],
        activatesFocusIndicator: false,
    },
    undo: { bindings: [{ key: 'z', ctrlOrMeta: true }], activatesFocusIndicator: false },
    submit: { bindings: [{ key: 'Enter' }, { code: 'Enter' }, { code: 'Space' }] },
    zoomin: { bindings: [{ key: '+' }, { code: 'ZoomIn' }, { code: 'Add' }], activatesFocusIndicator: false },
    zoomout: { bindings: [{ key: '-' }, { code: 'ZoomOut' }, { code: 'Substract' }], activatesFocusIndicator: false },
};

function matchesKeyBinding(e: KeyboardEvent, bindings: Readonly<KeyBinding>[]) {
    for (const kb of bindings) {
        if ('code' in kb) {
            if (kb.code === e.code) return true;
        } else {
            const matches =
                kb.key === e.key &&
                (kb.shift === undefined || kb.shift === e.shiftKey) &&
                (kb.ctrlOrMeta === undefined || kb.ctrlOrMeta === e.ctrlKey || kb.ctrlOrMeta === e.metaKey);
            if (matches) return true;
        }
    }
    return false;
}

export function mapKeyboardEventToAction(event: KeyboardEvent): KeyAction | undefined {
    for (const [actionName, { activatesFocusIndicator = true, bindings }] of entries(KEY_BINDINGS)) {
        if (matchesKeyBinding(event, bindings)) {
            return { name: actionName, activatesFocusIndicator };
        }
    }
    return undefined;
}
