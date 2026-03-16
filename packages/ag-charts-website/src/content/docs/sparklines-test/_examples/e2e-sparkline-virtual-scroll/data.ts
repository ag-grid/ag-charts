export function getData(): { x: number; y: number }[] {
    return Array.from({ length: 20 }, (_, i) => ({
        x: i,
        y: Math.sin(i * 0.5) * 50 + 50 + Math.random() * 10,
    }));
}
