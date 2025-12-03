import { SceneChangeDetection, isNumberEqual, normalizeAngle360 } from 'ag-charts-core';

import { BBox } from '../bbox';
import { Path } from './path';

enum ArcType {
    Open,
    Chord,
    Round,
}

/**
 * Elliptical arc node.
 */
export class Arc<D = any> extends Path<D> {
    static override readonly className = 'Arc';

    @SceneChangeDetection()
    centerX: number = 0;

    @SceneChangeDetection()
    centerY: number = 0;

    @SceneChangeDetection()
    radius: number = 10;

    @SceneChangeDetection()
    startAngle: number = 0;

    @SceneChangeDetection()
    endAngle: number = Math.PI * 2;

    private get fullPie(): boolean {
        return isNumberEqual(normalizeAngle360(this.startAngle), normalizeAngle360(this.endAngle));
    }

    @SceneChangeDetection()
    counterClockwise: boolean = false;

    /**
     * The type of arc to render:
     * - {@link ArcType.Open} - end points of the arc segment are not connected (default)
     * - {@link ArcType.Chord} - end points of the arc segment are connected by a line segment
     * - {@link ArcType.Round} - each of the end points of the arc segment are connected
     *                           to the center of the arc
     * Arcs with {@link ArcType.Open} do not support hit testing, even if they have their
     * {@link Shape.fillStyle} set, because they are not closed paths. Hit testing support
     * would require using two paths - one for rendering, another for hit testing - and there
     * doesn't seem to be a compelling reason to do that, when one can just use {@link ArcType.Chord}
     * to create a closed path.
     */
    @SceneChangeDetection()
    type: ArcType = ArcType.Open;

    override updatePath(): void {
        const path = this.path;

        path.clear(); // No need to recreate the Path, can simply clear the existing one.
        path.arc(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle, this.counterClockwise);

        if (this.type === ArcType.Chord) {
            path.closePath();
        } else if (this.type === ArcType.Round && !this.fullPie) {
            path.lineTo(this.centerX, this.centerY);
            path.closePath();
        }
    }

    protected override computeBBox(): BBox {
        // Only works with full arcs (circles) and untransformed ellipses.
        return new BBox(this.centerX - this.radius, this.centerY - this.radius, this.radius * 2, this.radius * 2);
    }

    override isPointInPath(x: number, y: number): boolean {
        const bbox = this.getBBox();

        return this.type !== ArcType.Open && bbox.containsPoint(x, y) && this.path.isPointInPath(x, y);
    }
}
