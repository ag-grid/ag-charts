import { _ModuleSupport, _Util } from 'ag-charts-community';

const { partialAssign, getWindow, createElement } = _ModuleSupport;
const { copyAttributes } = _Util;

export function createFocusMask(target: HTMLElement): HTMLElement {
    const mask = createElement('div');
    const targetStyle = getWindow().getComputedStyle(target);

    mask.className = 'ag-charts-focus-mask';
    mask.tabIndex = -1;
    mask.style.position = 'absolute';
    mask.style.pointerEvents = 'none';
    partialAssign(['width', 'height'], mask.style, targetStyle);
    copyAttributes(['role', 'aria-labelledby'], mask, target);

    const disappear = () => {
        mask.removeEventListener('keydown', disappear);
        mask.removeEventListener('blur', disappear);
        mask.remove();
    };
    mask.addEventListener('blur', disappear);
    mask.addEventListener('keydown', () => {
        target.focus();
        disappear();
    });

    target.insertAdjacentElement('beforebegin', mask);
    return mask;
}
