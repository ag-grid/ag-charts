import { Debug } from '../globals';
import type { AxisID, ElementID } from './idBranding';

type IDTypes = ElementID | AxisID;

/**
 * Interface for classes that can have IDs generated via createId().
 * Implementing classes MUST define: static readonly className: string
 */
export interface Identifiable {
    constructor: {
        readonly className?: string;
        readonly name?: string;
    };
}

const ID_MAP = new Map<string, number>();
let nextElementID: number = 1;

export function resetIds() {
    ID_MAP.clear();
    nextElementID = 1;
}

export function createId<T extends IDTypes | string = string>(instance: Identifiable): T {
    const constructor = instance.constructor;
    let className = Object.hasOwn(constructor, 'className') ? constructor.className : constructor.name;

    Debug.inDevelopmentMode(() => {
        if (!className) {
            throw new Error(`The ${String(constructor)} is missing the 'className' property.`);
        }
    });
    className ??= 'Unknown';

    const nextId = (ID_MAP.get(className) ?? 0) + 1;
    ID_MAP.set(className, nextId);

    return `${className}-${nextId}` as T;
}

export function createElementId(): ElementID {
    return `ag-charts-${nextElementID++}` as ElementID;
}

export function generateUUID(): string {
    // Prefer crypto.randomUUID which isn't available in certain environments,
    // Fallback to an implementation using crypto.getRandomValues.
    return crypto.randomUUID?.() ?? generateUUIDv4();
}

function generateUUIDv4(): string {
    // Create a new array of 16 random values
    const uuidArray = new Uint8Array(16);
    crypto.getRandomValues(uuidArray);

    // Set specific bits for UUID version and variant
    uuidArray[6] = (uuidArray[6] & 0x0f) | 0x40; // UUID version 4 (random)
    uuidArray[8] = (uuidArray[8] & 0x3f) | 0x80; // Variant (RFC4122)

    // Convert the array to a string representation of a UUID
    let uuid = '';
    for (let i = 0; i < uuidArray.length; i++) {
        // Insert hyphens at the appropriate positions (8-4-4-4-12)
        if (i === 4 || i === 6 || i === 8 || i === 10) {
            uuid += '-';
        }
        uuid += uuidArray[i].toString(16).padStart(2, '0');
    }
    return uuid;
}
