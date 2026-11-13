import type { Direction } from 'ag-charts-types';

export function hasNoModifiers(event: KeyboardEvent | MouseEvent | TouchEvent): boolean {
    return !(event.shiftKey || event.altKey || event.ctrlKey || event.metaKey);
}

export function matchesKey(event: KeyboardEvent, ...keys: string[]): boolean {
    return hasNoModifiers(event) && keys.includes(event.key);
}

const PREV_NEXT_KEYS = {
    horizontal: { nextKey: 'ArrowRight', prevKey: 'ArrowLeft' },
    vertical: { nextKey: 'ArrowDown', prevKey: 'ArrowUp' },
};

const RTL_PREV_NEXT_HORIZONTAL_KEYS = { nextKey: 'ArrowLeft', prevKey: 'ArrowRight' };

export function getPrevNextKeys(orientation: Direction, isRtl?: boolean) {
    return isRtl && orientation === 'horizontal' ? RTL_PREV_NEXT_HORIZONTAL_KEYS : PREV_NEXT_KEYS[orientation];
}

export function isButtonClickEvent(event: KeyboardEvent | MouseEvent): boolean {
    if ('button' in event) {
        return event.button === 0;
    }
    // Use `key` for Enter so Numpad Enter also counts.
    return hasNoModifiers(event) && (event.code === 'Space' || event.key === 'Enter');
}
