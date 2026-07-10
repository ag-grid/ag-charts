import { entries } from 'ag-charts-core';

type KeyModifiers = {
    readonly ctrlOrMeta?: boolean;
    readonly shift?: boolean;
    readonly alt?: boolean;
};
type KeyBinding = ({ readonly key: string } & KeyModifiers) | ({ readonly code: string } & KeyModifiers);
type KeyActionConfig = {
    readonly bindings: readonly KeyBinding[];
    readonly activatesFocusIndicator?: boolean;
};
type KeyAction = {
    readonly name: keyof typeof KEY_BINDINGS;
    readonly activatesFocusIndicator: boolean;
};

const KEY_BINDING_LITERALS = {
    arrowdown: { bindings: [{ code: 'ArrowDown', alt: false, ctrlOrMeta: false, shift: false }] },
    arrowleft: { bindings: [{ code: 'ArrowLeft', alt: false, ctrlOrMeta: false, shift: false }] },
    arrowright: { bindings: [{ code: 'ArrowRight', alt: false, ctrlOrMeta: false, shift: false }] },
    arrowup: { bindings: [{ code: 'ArrowUp', alt: false, ctrlOrMeta: false, shift: false }] },
    expand: { bindings: [{ code: 'ArrowDown', alt: true, ctrlOrMeta: false, shift: false }] },
    collapse: { bindings: [{ code: 'ArrowUp', alt: true, ctrlOrMeta: false, shift: false }] },
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
    panxleft: { bindings: [{ key: 'PageUp' }, { code: 'PageUp' }], activatesFocusIndicator: true },
    panxright: { bindings: [{ key: 'PageDown' }, { code: 'PageDown' }], activatesFocusIndicator: true },
} as const satisfies { [K in string]: KeyActionConfig };

// Type-safe conversion from const-types (e.g. `{bindings:[{code:'ArrowDown'}]}`) to `KeyActionConfig`:
const KEY_BINDINGS: { [K in keyof typeof KEY_BINDING_LITERALS]: KeyActionConfig } = KEY_BINDING_LITERALS;

function matchesState(eventModifier: boolean, bindingModifier: boolean | undefined): boolean {
    return bindingModifier === undefined || bindingModifier === eventModifier;
}

function matchesModifiers(e: KeyboardEvent, bindings: KeyModifiers) {
    return (
        matchesState(e.ctrlKey || e.metaKey, bindings.ctrlOrMeta) &&
        matchesState(e.altKey, bindings.alt) &&
        matchesState(e.shiftKey, bindings.shift)
    );
}
function matchesKeyBinding(e: KeyboardEvent, bindings: readonly KeyBinding[]) {
    for (const kb of bindings) {
        if ('code' in kb) {
            if (kb.code === e.code && matchesModifiers(e, kb)) return true;
        }
        if ('key' in kb) {
            if (kb.key === e.key && matchesModifiers(e, kb)) return true;
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
