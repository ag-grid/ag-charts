import { _Scene } from 'ag-charts-community';

const { BBox, Path, ScenePathChangeDetection } = _Scene;

export function bezierControlPoints({
    radius,
    startAngle,
    endAngle,
    tension,
}: {
    radius: number;
    startAngle: number;
    endAngle: number;
    tension: number;
}) {
    const cp0x = radius * Math.cos(startAngle);
    const cp0y = radius * Math.sin(startAngle);
    const cp3x = radius * Math.cos(endAngle);
    const cp3y = radius * Math.sin(endAngle);
    const cp1x = cp0x * tension;
    const cp1y = cp0y * tension;
    const cp2x = cp3x * tension;
    const cp2y = cp3y * tension;

    return {
        x: [cp0x, cp1x, cp2x, cp3x] as const,
        y: [cp0y, cp1y, cp2y, cp3y] as const,
    };
}
export class ChordLink extends Path {
    @ScenePathChangeDetection()
    centerX: number = 0;

    @ScenePathChangeDetection()
    centerY: number = 0;

    @ScenePathChangeDetection()
    radius: number = 0;

    @ScenePathChangeDetection()
    startAngle1: number = 0;

    @ScenePathChangeDetection()
    endAngle1: number = 0;

    @ScenePathChangeDetection()
    startAngle2: number = 0;

    @ScenePathChangeDetection()
    endAngle2: number = 0;

    @ScenePathChangeDetection()
    tension: number = 1;

    protected override computeBBox(): _Scene.BBox | undefined {
        const { centerX, centerY, radius, startAngle1, endAngle1, startAngle2, endAngle2, tension } = this;

        const outer = bezierControlPoints({ radius, startAngle: startAngle1, endAngle: endAngle2, tension });
        const inner = bezierControlPoints({ radius, startAngle: startAngle2, endAngle: endAngle1, tension });

        // The bbox of a Bezier's control points contains the bbox of the bezier itself
        const x = Math.min(...outer.x, ...inner.x);
        const width = Math.max(...outer.x, ...inner.x) - x;
        const y = Math.min(...outer.y, ...inner.y);
        const height = Math.max(...outer.y, ...inner.y) - y;

        return new BBox(centerX + x, centerY + y, width, height);
    }

    private tensionedCurveTo(
        cp0x: number,
        cp0y: number,
        cp1x: number,
        cp1y: number,
        cp2x: number,
        cp2y: number,
        cp3x: number,
        cp3y: number
    ) {
        const { path, tension } = this;
        const scale = 1 - tension;

        path.cubicCurveTo(
            (cp1x - cp0x) * scale + cp0x,
            (cp1y - cp0y) * scale + cp0y,
            (cp2x - cp3x) * scale + cp3x,
            (cp2y - cp3y) * scale + cp3y,
            cp3x,
            cp3y
        );
    }

    override updatePath(): void {
        const { path, centerX, centerY, radius } = this;
        let { startAngle1, endAngle1, startAngle2, endAngle2 } = this;
        if (startAngle1 > startAngle2) {
            [startAngle1, startAngle2] = [startAngle2, startAngle1];
            [endAngle1, endAngle2] = [endAngle2, endAngle1];
        }

        path.clear();
        const startX = centerX + radius * Math.cos(startAngle1);
        const startY = centerY + radius * Math.sin(startAngle1);
        path.moveTo(startX, startY);
        this.tensionedCurveTo(
            startX,
            startY,
            centerX,
            centerY,
            centerX,
            centerY,
            centerX + radius * Math.cos(endAngle2),
            centerY + radius * Math.sin(endAngle2)
        );
        path.arc(centerX, centerY, radius, endAngle2, startAngle2, true);
        this.tensionedCurveTo(
            centerX + radius * Math.cos(startAngle2),
            centerY + radius * Math.sin(startAngle2),
            centerX,
            centerY,
            centerX,
            centerY,
            centerX + radius * Math.cos(endAngle1),
            centerY + radius * Math.sin(endAngle1)
        );
        path.arc(centerX, centerY, radius, endAngle1, startAngle1, true);
        path.closePath();
    }
}
