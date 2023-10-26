const NUM_DATA_POINTS = 30;

export function getData(offset = 0) {
    seed = 1234;
    const data: Array<{ year: number; spending: number }> = [];
    for (let i = 0; i < NUM_DATA_POINTS + offset; i++) {
        data.push({
            year: new Date().getFullYear() - NUM_DATA_POINTS + i,
            spending: i === 0 ? random() * 100 * 4 - 2 : data[i - 1].spending + random() * 4 - 2,
        });
    }
    return data.slice(offset);
}

// Simple seeded randomisation for consistent data - https://stackoverflow.com/a/19303725
let seed = 1234;
function random() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}
