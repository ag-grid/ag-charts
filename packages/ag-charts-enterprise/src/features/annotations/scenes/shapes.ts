import { _Scene } from 'ag-charts-community';

const magnitude = (x: number, y: number) => Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

export class CollidableLine extends _Scene.Line {
    public collisionBBox?: _Scene.BBox;
    private readonly growCollisionBox = 2;

    updateCollisionBBox() {
        const x = this.x1;
        const height = this.strokeWidth + this.growCollisionBox;
        const y = this.y1 - Math.floor(height / 2);
        const width = magnitude(this.x2 - x, this.y2 - y);

        this.collisionBBox = new _Scene.BBox(x, y, width, height);
    }

    override isPointInPath(pointX: number, pointY: number) {
        // Rotate the point and line about the origin of the line such that the line is horizontal, then check if this
        // rotated collision bbox contains the rotated point.

        const { collisionBBox, x1, y1, x2, y2 } = this;
        if (!collisionBBox) return false;

        pointX -= x1;
        pointY -= y1;

        const endX = x2 - x1;
        const endY = y2 - y1;

        const angle = Math.atan2(pointY, pointX) - Math.atan2(endY, endX);
        const mag = magnitude(pointX, pointY);

        const x = x1 + mag * Math.cos(angle);
        const y = y1 + mag * Math.sin(angle);

        return collisionBBox.containsPoint(x, y) ?? false;
    }
}

/*

// TODO: Multi segment paths? Curved paths?

export class CollidablePath extends _Scene.Path {
    // TODO: box per segment

    private collisionBBox?: _Scene.BBox;
    private growCollisionBox = 1;

    updateCollisionBBox() {
        const points = this.path.getPoints();

        const x = points[0].x;
        const height = this.strokeWidth + this.growCollisionBox;
        const y = points[0].y - Math.floor(height / 2);
        const width = magnitude(points[1].x - x, points[1].y - y);

        this.collisionBBox = new _Scene.BBox(x, y, width, height);
    }

    override isPointInPath(px: number, py: number) {
        // Rotate the point and line about the origin of the line such that the line is horizontal, then check if this
        // rotated collision bbox contains the rotated point.

        const { collisionBBox, path } = this;
        if (!collisionBBox) return false;

        const points = path.getPoints();

        if (points.length !== 2) return false;

        const ox = points[0].x;
        const oy = points[0].y + Math.floor(collisionBBox.height / 2);

        px -= ox;
        py -= oy;

        const x2 = points[1].x - ox;
        const y2 = points[1].y - oy;

        const angle = Math.atan2(py, px) - Math.atan2(y2, x2);
        const mag = magnitude(px, py);

        const x = ox + mag * Math.cos(angle);
        const y = oy + mag * Math.sin(angle);

        return this.collisionBBox?.containsPoint(x, y) ?? false;
    }
}

*/
