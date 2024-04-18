type AttributeTypeMap = {
    role: 'status' | 'figure';
    'aria-live': 'assertive' | 'polite';
    'aria-label': string;
};

export function setAttribute<A extends keyof AttributeTypeMap>(
    e: HTMLElement | undefined,
    qualifiedName: A,
    value: AttributeTypeMap[A]
) {
    if (value === undefined || value === '') {
        e?.removeAttribute(qualifiedName);
    } else {
        e?.setAttribute(qualifiedName, value);
    }
}
