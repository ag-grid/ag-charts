export function getData(count = 400, offset = 0) {
    const data: Array<{ year: number; spending: number }> = [];
    for (let i = 0; i < count; i++) {
        data.push({
            year: new Date().getFullYear() - count + i + offset,
            spending: i === 0 ? Math.random() * 100 : data[i - 1].spending + Math.random() * 10 - 5,
        });
    }
    return data;
}
