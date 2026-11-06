import { getDocument } from '../dom/globalsProxy';

/**
 * Constructor arguments with an optional leading `Document`: the document to create the element in. Pass the chart
 * container's `ownerDocument` when the chart may live in another window, such as a popup.
 */
export type WithOwnerDocument<T extends unknown[]> = T | [ownerDocument: Document, ...rest: T];

export function splitOwnerDocument<T extends unknown[]>(args: WithOwnerDocument<T>): [Document, T] {
    const [first, ...rest] = args;
    if (typeof first === 'object' && first !== null) {
        return [first as Document, rest as T];
    }
    return [getDocument(), args as T];
}
