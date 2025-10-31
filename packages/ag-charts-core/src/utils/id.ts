import type { AxisID, ElementID } from './idBranding';

type IDTypes = ElementID | AxisID;

const ID_MAP = new Map<string, number>();
let nextElementID: number = 1;

export function resetIds() {
    ID_MAP.clear();
    nextElementID = 1;
}

export function createId<T extends IDTypes | string = string>(instance: any): T {
    const constructor = instance.constructor;
    const className = Object.hasOwn(constructor, 'className') ? constructor.className : constructor.name;

    if (!className) {
        throw new Error(`The ${constructor} is missing the 'className' property.`);
    }
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
