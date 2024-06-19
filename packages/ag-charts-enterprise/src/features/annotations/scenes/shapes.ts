import { _Scene, _Util } from 'ag-charts-community';

const { Vec2 } = _Util;

export class CollidableLine extends _Scene.Line {
    public collisionBBox?: _Scene.BBox;
    private readonly growCollisionBox = 9;

    updateCollisionBBox() {
        const { growCollisionBox, strokeWidth, x1, y1, x2, y2 } = this;

        // Update the collision bbox such that it is a horizontal representation of the line, with some extra height
        // for fuzzier selection.
        let height = strokeWidth + growCollisionBox;

        // Ensure there is an even growth both sides of the stroke
        if (height % 2 === 0) height += 1;

        const topLeft = Vec2.from(x1, y1 - Math.floor(height / 2));
        const bottomRight = Vec2.from(x2, y2);
        const width = Vec2.distance(topLeft, bottomRight);

        this.collisionBBox = new _Scene.BBox(topLeft.x, topLeft.y, width, height);
    }

    override isPointInPath(pointX: number, pointY: number) {
        // Rotate the point about the origin of the line so that it represents the equivalent point on the horizontal
        // collision bbox, then check if this horizontal bbox contains the rotated point.

        const { collisionBBox, x1, y1, x2, y2 } = this;
        if (!collisionBBox) return false;

        const v1 = Vec2.from(x1, y1);
        const v2 = Vec2.from(x2, y2);

        const point = Vec2.sub(Vec2.from(pointX, pointY), v1);
        const end = Vec2.sub(v2, v1);
        const rotated = Vec2.rotate(point, Vec2.angle(point, end), v1);

        return collisionBBox.containsPoint(rotated.x, rotated.y) ?? false;
    }
}
