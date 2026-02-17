import { AgDocument } from './agDocument';

type Listener = EventListenerOrEventListenerObject;
type ListenerRegistration = { listener: Listener; capture: boolean; once: boolean };

class MockWindow {
    private readonly listeners = new Map<string, Set<ListenerRegistration>>();

    addEventListener(type: string, listener: Listener, options?: boolean | AddEventListenerOptions) {
        const capture = this.getCapture(options);
        const once = this.getOnce(options);
        let typeListeners = this.listeners.get(type);
        if (typeListeners == null) {
            typeListeners = new Set();
            this.listeners.set(type, typeListeners);
        }

        if ([...typeListeners].some((entry) => entry.listener === listener && entry.capture === capture)) return;
        typeListeners.add({ listener, capture, once });
    }

    removeEventListener(type: string, listener: Listener, options?: boolean | EventListenerOptions) {
        const capture = this.getCapture(options);
        const typeListeners = this.listeners.get(type);
        if (typeListeners == null) return;

        for (const entry of typeListeners) {
            if (entry.listener === listener && entry.capture === capture) {
                typeListeners.delete(entry);
                break;
            }
        }

        if (typeListeners.size === 0) {
            this.listeners.delete(type);
        }
    }

    hasEventListener(type: string, listener: Listener, options?: boolean | EventListenerOptions) {
        const capture = this.getCapture(options);
        return [...(this.listeners.get(type) ?? [])].some(
            (entry) => entry.listener === listener && entry.capture === capture
        );
    }

    dispatch(type: string) {
        const typeListeners = this.listeners.get(type);
        if (typeListeners == null) return;

        for (const entry of [...typeListeners]) {
            if (typeof entry.listener === 'function') {
                entry.listener(new Event(type));
            } else {
                entry.listener.handleEvent(new Event(type));
            }

            if (entry.once) {
                typeListeners.delete(entry);
            }
        }

        if (typeListeners.size === 0) {
            this.listeners.delete(type);
        }
    }

    private getCapture(options?: boolean | EventListenerOptions): boolean {
        return typeof options === 'boolean' ? options : !!options?.capture;
    }

    private getOnce(options?: boolean | AddEventListenerOptions): boolean {
        return options != null && typeof options !== 'boolean' && options.once === true;
    }
}

function createMockDocument(window: MockWindow): Document {
    return { defaultView: window } as unknown as Document;
}

function createMockContainer(document: Document): HTMLElement {
    return { ownerDocument: document } as HTMLElement;
}

describe('AgDocument', () => {
    it('removes capture listeners from the previous window when container changes', () => {
        const win1 = new MockWindow();
        const win2 = new MockWindow();
        const doc1 = createMockDocument(win1);
        const doc2 = createMockDocument(win2);
        const agDocument = new AgDocument(doc1, win1 as unknown as Window);
        const listener = jest.fn();

        agDocument.attachListener('click', listener, { capture: true });
        expect(win1.hasEventListener('click', listener, { capture: true })).toBe(true);

        agDocument.setContainer(createMockContainer(doc2));

        expect(win1.hasEventListener('click', listener, { capture: true })).toBe(false);
        expect(win2.hasEventListener('click', listener, { capture: true })).toBe(true);
    });

    it('uses the original add options when disposer remove options are omitted', () => {
        const win = new MockWindow();
        const doc = createMockDocument(win);
        const agDocument = new AgDocument(doc, win as unknown as Window);
        const listener = jest.fn();

        const removeListener = agDocument.attachListener('pointerdown', listener, { capture: true });
        expect(win.hasEventListener('pointerdown', listener, { capture: true })).toBe(true);

        removeListener();

        expect(win.hasEventListener('pointerdown', listener, { capture: true })).toBe(false);
    });

    it('prunes once listeners from internal tracking after they fire', () => {
        const win1 = new MockWindow();
        const win2 = new MockWindow();
        const doc1 = createMockDocument(win1);
        const doc2 = createMockDocument(win2);
        const agDocument = new AgDocument(doc1, win1 as unknown as Window);
        const listener = jest.fn();

        agDocument.attachListener('pointerup', listener, { once: true });
        win1.dispatch('pointerup');
        expect(listener).toHaveBeenCalledTimes(1);

        agDocument.setContainer(createMockContainer(doc2));

        expect(win2.hasEventListener('pointerup', listener)).toBe(false);
    });
});
