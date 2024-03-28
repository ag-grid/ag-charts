import { createElement } from '../util/dom';

export class InternalPath2D {
    private static ctx: CanvasRenderingContext2D | null = null;

    private openedPath: boolean = false;
    public closedPath: boolean = false;

    private path = '';
    private prev = '';

    // if made obsolete, we can remove all string manipulation and use Path2D methods directly
    isDirty() {
        return this.path !== this.prev;
    }

    getPath2D() {
        return new Path2D(this.path);
    }

    moveTo(x: number, y: number) {
        this.path += `M${x},${y}`;
        this.openedPath = true;
    }

    lineTo(x: number, y: number) {
        if (this.openedPath) {
            this.path += `L${x},${y}`;
        } else {
            this.moveTo(x, y);
        }
    }

    rect(x: number, y: number, width: number, height: number) {
        this.path += `M${x},${y}H${x + width}V${y + height}H${x}Z`;
        this.openedPath = false;
        this.closedPath = true;
    }

    roundRect(x: number, y: number, width: number, height: number, radii: number) {
        // Newer API - so support is limited
        // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/roundRect
        radii = Math.min(radii, width / 2, height / 2);
        this.path += `M${x},${y + radii}A${radii},${radii} 0 0,1 ${x + radii},${y}`;
        this.path += `L${x + width - radii},${y}A${radii},${radii} 0 0,1 ${x + width},${y + radii}`;
        this.path += `L${x + width},${y + height - radii}A${radii},${radii} 0 0,1 ${x + width - radii},${y + height}`;
        this.path += `L${x + radii},${y + height}A${radii},${radii} 0 0,1 ${x},${y + height - radii}`;
        this.path += `L${x},${y + radii}Z`;
        this.openedPath = false;
        this.closedPath = true;
    }

    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterClockwise?: boolean) {
        if (startAngle === endAngle) return;

        const TAU = Math.PI * 2;

        startAngle %= TAU;
        endAngle %= TAU;

        const startX = x + radius * Math.cos(startAngle);
        const startY = y + radius * Math.sin(startAngle);

        this.lineTo(startX, startY);

        if (startAngle === endAngle) {
            const sweepFlag = counterClockwise ? 1 : 0;

            // draw a circle as two relative arcs
            this.path += `a${radius},${radius} 0 1,${sweepFlag} ${radius * -2},0`;
            this.path += `a${radius},${radius} 0 1,${sweepFlag} ${radius * 2},0`;
        } else {
            const endX = x + radius * Math.cos(endAngle);
            const endY = y + radius * Math.sin(endAngle);
            const sweepFlag = counterClockwise ? 0 : 1;

            let diff = endAngle - startAngle;

            if (diff < 0) {
                diff += TAU;
            }

            // @ts-expect-error
            const largeArcFlag = counterClockwise ^ (diff > Math.PI);

            this.path += `A${radius},${radius} 0 ${largeArcFlag},${sweepFlag} ${endX},${endY}`;
        }
    }

    cubicCurveTo(cx1: number, cy1: number, cx2: number, cy2: number, x: number, y: number) {
        if (!this.openedPath) {
            this.moveTo(cx1, cy1);
        }
        this.path += `C${cx1},${cy1} ${cx2},${cy2} ${x},${y}`;
    }

    closePath() {
        if (this.openedPath) {
            this.openedPath = false;
            this.closedPath = true;
            this.path += 'Z';
        }
    }

    clear(trackChanges?: boolean) {
        if (trackChanges) {
            this.prev = this.path;
        }
        this.openedPath = false;
        this.closedPath = false;
        this.path = '';
    }

    isPointInPath(x: number, y: number): boolean {
        InternalPath2D.ctx ??= createElement('canvas').getContext('2d');
        return InternalPath2D.ctx!.isPointInPath(this.getPath2D(), x, y);
    }
}
