import { getWindow } from './globalsProxy';

// getWindow is required to make sure this works on our CI.
// Using Option instead of createElement because it should be faster.
let style: CSSStyleDeclaration;
export function parseColor(color: string): string | null {
    if (style == null) {
        const OptionConstructor = getWindow<new () => any>('Option');
        style = new OptionConstructor().style;
    }
    style.color = color;
    return style.color || null;
}
