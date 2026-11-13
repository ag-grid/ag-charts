import { isElement } from './globalsProxy';

export function getLastFocus(sourceEvent: Event | undefined): HTMLElement | undefined {
    const target = sourceEvent?.target;
    if (isElement(target) && 'tabindex' in (target as HTMLElement).attributes) {
        return target as HTMLElement;
    }
    return undefined;
}
