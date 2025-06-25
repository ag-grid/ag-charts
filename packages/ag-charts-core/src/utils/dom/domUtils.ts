import { getWindow } from './globalsProxy';

// getWindow is required to make sure this works on our CI.
// Using Option instead of createElement because it should be faster.
const { style } = new (getWindow<new () => any>('Option'))();
export function parseColor(color: string): string | null {
    style.color = color;
    return style.color || null;
}
