export function guardCancelAndExit({ key }: { key: string }) {
    return key === 'Escape';
}

export function guardSaveAndExit({ key, shiftKey }: { key: string; shiftKey: boolean }) {
    return !shiftKey && key === 'Enter';
}
