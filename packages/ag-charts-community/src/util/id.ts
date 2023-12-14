const ID_MAP: Record<string, number> = {};

export function resetIds() {
    for (const key in ID_MAP) {
        delete ID_MAP[key];
    }
}

export function createId(instance: any, reservedIds?: string[]): string {
    const constructor = instance.constructor;
    const className = Object.prototype.hasOwnProperty.call(constructor, 'className')
        ? constructor.className
        : constructor.name;

    if (!className) {
        throw new Error(`The ${constructor} is missing the 'className' property.`);
    }

    const reservedSet = new Set<string>(reservedIds ?? []);
    let id: string;
    do {
        const nextId = (ID_MAP[className] ?? 0) + 1;
        ID_MAP[className] = nextId;

        id = className + '-' + nextId;
    } while (reservedSet.has(id));

    return id;
}
