export function getData(): { x: number; y: number }[] {
    const data: { x: number; y: number }[] = [];
    for (let x = -10; x <= 10; x += 0.5) {
        data.push({ x, y: Math.round(x * x * x) / 10 });
    }
    return data;
}
