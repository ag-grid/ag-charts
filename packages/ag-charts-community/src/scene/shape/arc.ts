import { normalizeAngle360 } from '../../util/angle';
import { isEqual } from '../../util/number';
import { BBox } from '../bbox';
import { Path, ScenePathChangeDetection } from './path';
import { Shape } from './shape';

enum ArcType {
    Open,
    Chord,
    Round,
}

/**
 * Elliptical arc node.
 */
export class Arc extends Path {
    static className = 'Arc';

    protected static defaultStyles = Object.assign({}, Shape.defaultStyles, {
        lineWidth: 1,
        fillStyle: null,
    });

    constructor() {
        super();
        this.restoreOwnStyles();
    }

    @ScenePathChangeDetection()
    centerX: number = 0;

    @ScenePathChangeDetection()
    centerY: number = 0;

    @ScenePathChangeDetection()
    radius: number = 10;

    @ScenePathChangeDetection()
    startAngle: number = 0;

    @ScenePathChangeDetection()
    endAngle: number = Math.PI * 2;

    private get fullPie(): boolean {
        return isEqual(normalizeAngle360(this.startAngle), normalizeAngle360(this.endAngle));
    }

    @ScenePathChangeDetection()
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
    @ScenePathChangeDetection()
    type: ArcType = ArcType.Open;

    updatePath(): void {
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

    computeBBox(): BBox {
        // Only works with full arcs (circles) and untransformed ellipses.
        return new BBox(this.centerX - this.radius, this.centerY - this.radius, this.radius * 2, this.radius * 2);
    }

    isPointInPath(x: number, y: number): boolean {
        const point = this.transformPoint(x, y);
        const bbox = this.computeBBox();

        return (
            this.type !== ArcType.Open &&
            bbox.containsPoint(point.x, point.y) &&
            this.path.isPointInPath(point.x, point.y)
        );
    }
}
