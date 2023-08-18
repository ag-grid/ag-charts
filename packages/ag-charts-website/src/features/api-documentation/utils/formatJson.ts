export const formatJson = (value: string) =>
    JSON.stringify(value, undefined, 2)
        .replace(/\[(.*?)\]/gs, (_, match) => `[${match.trim().replace(/,\s+/gs, ', ')}]`) // remove carriage returns from arrays
        .replace(/"/g, "'"); // use single quotes
