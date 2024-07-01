export declare function initToolbarKeyNav(opts: {
    orientation: 'horizontal' | 'vertical';
    toolbar: HTMLElement;
    buttons: HTMLElement[];
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    onEscape?: (event: KeyboardEvent) => void;
}): (() => void)[];
export declare function initMenuKeyNav(opts: {
    orientation: 'vertical';
    menu: HTMLElement;
    buttons: HTMLElement[];
    onEscape?: (event: KeyboardEvent) => void;
}): (() => void)[];
export declare function makeAccessibleClickListener(element: HTMLElement, onclick: (event: MouseEvent) => unknown): (event: MouseEvent) => void;
