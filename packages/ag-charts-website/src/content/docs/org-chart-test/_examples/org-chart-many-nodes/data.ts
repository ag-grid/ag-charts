const MAX_DEPTH = 3;
const MAX_CHILDREN = 3;

let count = 0;

function generateData(maxDepth: number, maxChildren: number, depth: number, parentId: string) {
    const data: Array<{ id: string; parentId: string; title: string; subtitle: string }> = [];

    for (let i = 0; i < maxChildren; i++) {
        const id = `id:${++count}`;
        data.push({ id, parentId, title: id, subtitle: id });
        if (depth < maxDepth) {
            data.push(...generateData(maxDepth, maxChildren, depth + 1, id));
        }
    }

    return data;
}

export function getData() {
    const id = `id:${++count}`;
    const data = [{ id, parentId: null, title: id }, ...generateData(MAX_DEPTH, MAX_CHILDREN, 1, id)];
    console.log(data.length);
    return data;
}

let seed = 1234;
function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}
