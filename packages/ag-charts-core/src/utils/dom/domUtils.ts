import { getWindow } from './globalsProxy';

export function parseColor(color: string): string | null {
    // getWindow is required to make sure this works on our CI.
    // Using Option instead of createElement because it should be faster.
    const OptionConstructor = getWindow<new () => any>('Option');
    const { style } = new OptionConstructor();
    style.color = color;
    return style.color || null;
}
