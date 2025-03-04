import { getWindow } from '../../globals';

export function parseColor(color: string): string | null {
    // getWindow is required to make sure this works on our CI.
    // Using Option instead of createElement because it should be faster.
    const OptionConstructor = Option ?? getWindow('Option');
    const { style } = new OptionConstructor();
    style.color = color;
    return style.color || null;
}
