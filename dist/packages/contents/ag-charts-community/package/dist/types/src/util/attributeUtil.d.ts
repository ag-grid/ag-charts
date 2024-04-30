type AttributeTypeMap = {
    role: 'status' | 'figure';
    'aria-live': 'assertive' | 'polite';
    'aria-label': string;
    'aria-hidden': boolean;
};
export declare function setAttribute<A extends keyof AttributeTypeMap>(e: HTMLElement | undefined, qualifiedName: A, value: AttributeTypeMap[A]): void;
export {};
