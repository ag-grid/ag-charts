export interface ElementProvider {
    getElement(): HTMLElement | undefined;
    getElementId(): string;
}
