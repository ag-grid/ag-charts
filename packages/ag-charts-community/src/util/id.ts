const ID_MAP = new Map<string, number>();

export function resetIds() {
    ID_MAP.clear();
}

export function createId(instance: any): string {
    const constructor = instance.constructor;
    const className = Object.hasOwn(constructor, 'className') ? constructor.className : constructor.name;

    if (!className) {
        throw new Error(`The ${constructor} is missing the 'className' property.`);
    }
    const nextId = (ID_MAP.get(className) ?? 0) + 1;
    ID_MAP.set(className, nextId);

    return `${className}-${nextId}`;
}

export function uuid() {
    const url = URL.createObjectURL(new Blob());
    return url.split('/').at(-1)!;
}
