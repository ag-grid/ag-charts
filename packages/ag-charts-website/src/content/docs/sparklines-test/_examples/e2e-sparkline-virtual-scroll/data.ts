// 150 points exceeds RENDER_TO_OFFSCREEN_CANVAS_THRESHOLD (100) so the
// offscreen rendering path in group.ts is exercised by these tests.
export function getData(): { x: number; y: number }[] {
    return Array.from({ length: 150 }, (_, i) => ({
        x: i,
        y: Math.sin(i * 0.5) * 50 + 50 + Math.random() * 10,
    }));
}
