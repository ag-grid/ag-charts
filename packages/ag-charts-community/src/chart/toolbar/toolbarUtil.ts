// https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/toolbar_role
export function initToolbarKeyNav(
    orientation: 'horizontal' | 'vertical',
    toolbar: HTMLElement,
    buttons: HTMLButtonElement[]
): (() => void)[] {
    const { nextKey, prevKey } = {
        horizontal: { nextKey: 'ArrowRight', prevKey: 'ArrowLeft' },
        vertical: { nextKey: 'ArrowUp', prevKey: 'ArrowDown' },
    }[orientation];
    toolbar.role = 'toolbar';
    toolbar.ariaOrientation = orientation;

    const destroyFns: (() => void)[] = [];
    const linkButtons = (src: HTMLButtonElement, dst: HTMLButtonElement | undefined, key: string) => {
        if (dst) {
            const listener = (ev: KeyboardEvent) => {
                if (ev.key === key) {
                    dst.focus();
                    dst.tabIndex = 0;
                    src.tabIndex = -1;
                }
            };
            src.addEventListener('keydown', listener);
            destroyFns.push(() => src.removeEventListener('keydown', listener));
        }
    };
    for (let i = 0; i < buttons.length; i++) {
        const prev = buttons[i - 1];
        const curr = buttons[i];
        const next = buttons[i + 1];
        linkButtons(curr, prev, prevKey);
        linkButtons(curr, next, nextKey);
        curr.tabIndex = i === 0 ? 0 : -1;
    }

    return destroyFns;
}
