type AttributeTypeMap = {
    role: 'status' | 'figure' | 'img';
    'aria-live': 'assertive' | 'polite';
    'aria-label': string | undefined;
    'aria-hidden': boolean;
};

export function setAttribute<A extends keyof AttributeTypeMap>(
    e: HTMLElement | undefined,
    qualifiedName: A,
    value: AttributeTypeMap[A]
) {
    if (value === undefined || value === '') {
        e?.removeAttribute(qualifiedName);
    } else {
        e?.setAttribute(qualifiedName, value.toString());
    }
}

export function setHidden(element: HTMLElement, hiddenToken: string, hidden: boolean) {
    element.ariaHidden = `${hidden}`;
    element.classList.toggle(hiddenToken, hidden);
}
