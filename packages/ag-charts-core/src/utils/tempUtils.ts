export function createIdsGenerator(): (name: string) => string {
    const idsCounter = new Map<string, number>();
    return (name: string) => {
        const counter = idsCounter.get(name);
        if (counter) {
            idsCounter.set(name, counter + 1);
            return `${name}_${counter}`;
        }
        idsCounter.set(name, 1);
        return name;
    };
}
