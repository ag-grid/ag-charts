const NUM_DATA_POINTS = 400;

export function getData() {
    const data: Array<{ year: number; spending: number }> = [];
    for (let i = 0; i < NUM_DATA_POINTS; i++) {
        data.push({
            year: new Date().getFullYear() - NUM_DATA_POINTS + i,
            spending: i === 0 ? random() * 100 : data[i - 1].spending + random() * 10 - 5,
        });
    }
    return data;
}

let seed = 1234;
function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}
