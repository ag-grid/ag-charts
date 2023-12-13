const ID_MAP: Record<string, number> = {};

export function resetIds() {
    for (const key in ID_MAP) {
        delete ID_MAP[key];
    }
}

export function createId(instance: any): string {
    const constructor = instance.constructor;
    const className = Object.prototype.hasOwnProperty.call(constructor, 'className')
        ? constructor.className
        : constructor.name;

    if (!className) {
        throw new Error(`The ${constructor} is missing the 'className' property.`);
    }
    const nextId = (ID_MAP[className] ?? 0) + 1;
    ID_MAP[className] = nextId;

    return className + '-' + nextId;
}

export function createUniqueIds(ids: (string | undefined)[]): {
    uniqueIds: (string | undefined)[];
    duplicates: { firstIndex: number; duplicateIndex: number }[];
} {
    const uniqueIds = [];
    const duplicates = [];
    const counterMap: Record<string, number> = {};

    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const firstIndex = uniqueIds.indexOf(id);
        if (id === undefined) {
            uniqueIds.push(id);
        } else if (firstIndex === -1) {
            uniqueIds.push(id);
        } else {
            const nextSuffix = (counterMap[id] ?? 1) + 1;
            counterMap[id] = nextSuffix;
            uniqueIds.push(`${id}-${nextSuffix}`);
            duplicates.push({ firstIndex, duplicateIndex: i });
        }
    }

    return { uniqueIds, duplicates };
}
