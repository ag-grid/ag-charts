type KeyBinding = { key: string; ctrlOrMeta?: boolean; shift?: boolean } | { code: string };

type KeyActionName =
    | 'arrowdown'
    | 'arrowleft'
    | 'arrowright'
    | 'arrowup'
    | 'delete'
    | 'undo'
    | 'redo'
    | 'submit'
    | 'zoomin'
    | 'zoomout';

const KEY_BINDINGS: { [K in KeyActionName]: Readonly<KeyBinding>[] } = {
    arrowdown: [{ code: 'ArrowDown' }],
    arrowleft: [{ code: 'ArrowLeft' }],
    arrowright: [{ code: 'ArrowRight' }],
    arrowup: [{ code: 'ArrowUp' }],
    delete: [{ key: 'Backspace' }, { key: 'Delete' }],
    redo: [
        { key: 'y', ctrlOrMeta: true },
        { key: 'z', ctrlOrMeta: true, shift: true },
    ],
    undo: [{ key: 'z', ctrlOrMeta: true }],
    submit: [{ key: 'Enter' }, { code: 'Enter' }, { code: 'Space' }],
    zoomin: [{ key: '+' }, { code: 'ZoomIn' }, { code: 'Add' }],
    zoomout: [{ key: '-' }, { code: 'ZoomOut' }, { code: 'Substract' }],
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

export function mapKeyboardEventToAction(event: KeyboardEvent): KeyActionName | undefined {
    for (const [actionName, bindings] of Object.entries(KEY_BINDINGS)) {
        if (matchesKeyBinding(event, bindings)) {
            return actionName as keyof typeof KEY_BINDINGS;
        }
    }
    return undefined;
}
