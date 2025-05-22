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
): () => void {
    element.addEventListener(eventName, handler as EventListener, options);
    return () => element.removeEventListener(eventName, handler as EventListener, options);
}
