import { _Scene } from 'ag-charts-community';

export class CollidableText extends _Scene.TransformableText {
    private readonly growCollisionBox = {
        top: 4,
        right: 4,
        bottom: 4,
        left: 4,
    };

    override isPointInPath(pointX: number, pointY: number) {
        const localPoint = this.fromParentPoint(pointX, pointY);

        const uBBox = this.computeBBoxWithoutTransforms();
        if (!uBBox) return false;

        return uBBox.grow(this.growCollisionBox).containsPoint(localPoint.x, localPoint.y);
    }
}
