import { Matrix } from '../../scene/matrix';

export class TransformMatrix {
    constructor(
        public scaleX = 1,
        public scaleY = 1,
        public rotation = 0,
        public translateX = 0,
        public translateY = 0,
        public scalePivotX = 0,
        public scalePivotY = 0,
        public rotationPivotX = 0,
        public rotationPivotY = 0
    ) {}

    toMatrix(target?: Matrix) {
        const elements = TransformMatrix.calculateTransformMatrix(
            this.scaleX,
            this.scaleY,
            this.rotation,
            this.translateX,
            this.translateY,
            this.scalePivotX,
            this.scalePivotY,
            this.rotationPivotX,
            this.rotationPivotY
        );
        return target?.setElements(elements) ?? new Matrix(elements);
    }

    toDomMatrix() {
        return new DOMMatrix(
            TransformMatrix.calculateTransformMatrix(
                this.scaleX,
                this.scaleY,
                this.rotation,
                this.translateX,
                this.translateY,
                this.scalePivotX,
                this.scalePivotY,
                this.rotationPivotX,
                this.rotationPivotY
            )
        );
    }

    static calculateTransformMatrix(
        scaleX: number,
        scaleY: number,
        rotation: number,
        translateX: number,
        translateY: number,
        scalePivotX: number = 0,
        scalePivotY: number = 0,
        rotationPivotX: number = 0,
        rotationPivotY: number = 0
    ): [number, number, number, number, number, number] {
        if (scaleX === 1 && scaleY === 1) {
            scalePivotX = scalePivotY = 0;
        }

        if (rotation === 0) {
            rotationPivotX = rotationPivotY = 0;
        }

        const scaleAdjustX = scalePivotX * (1 - scaleX) - rotationPivotX;
        const scaleAdjustY = scalePivotY * (1 - scaleY) - rotationPivotY;
        const cosTheta = Math.cos(rotation);
        const sinTheta = Math.sin(rotation);

        return [
            cosTheta * scaleX,
            sinTheta * scaleX,
            -sinTheta * scaleY,
            cosTheta * scaleY,
            cosTheta * scaleAdjustX - sinTheta * scaleAdjustY + rotationPivotX + translateX,
            sinTheta * scaleAdjustX + cosTheta * scaleAdjustY + rotationPivotY + translateY,
        ];
    }
}
