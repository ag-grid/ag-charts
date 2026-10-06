type EventMapFor<T> = T extends Window
    ? WindowEventMap
    : T extends Document
      ? DocumentEventMap
      : T extends HTMLElement
        ? HTMLElementEventMap
        : never;

export function attachListener<T extends Document | HTMLElement | Window, K extends keyof EventMapFor<T>>(
    element: T,
    eventName: K & string,
    handler: (this: T, event: EventMapFor<T>[K]) => void,
    options?: boolean | AddEventListenerOptions
): () => void;

export function attachListener(
    element: Document | HTMLElement | Window,
    eventName: string,
    handler: (event: Event) => void,
    options?: boolean | AddEventListenerOptions
): () => void {
    element.addEventListener(eventName, handler, options);
    return () => element.removeEventListener(eventName, handler, options);
}
