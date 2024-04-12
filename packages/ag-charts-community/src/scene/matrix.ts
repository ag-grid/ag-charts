import { BBox } from './bbox';

export class Matrix {
    domMatrix: DOMMatrix;

    get elements() {
        const m = this.domMatrix;
        return [m.a, m.b, m.c, m.d, m.e, m.f];
    }

    constructor(elements?: number[] | DOMMatrix) {
        this.domMatrix = elements && elements instanceof DOMMatrix ? elements : new DOMMatrix(elements);
    }

    setElements(elements: number[]): this {
        const m = this.domMatrix;
        m.a = elements[0];
        m.b = elements[1];
        m.c = elements[2];
        m.d = elements[3];
        m.e = elements[4];
        m.f = elements[5];
        return this;
    }

    /**
     * The `other` matrix gets post-multiplied to the current matrix.
     * Returns the current matrix.
     * @param other
     */
    multiplySelf(other: Matrix) {
        this.domMatrix.multiplySelf(other.domMatrix);
        return this;
    }

    preMultiplySelf(other: Matrix) {
        this.domMatrix.preMultiplySelf(other.domMatrix);
        return this;
    }

    /**
     * Returns the inverse of this matrix as a new matrix.
     */
    inverse() {
        return new Matrix(this.domMatrix.inverse());
    }

    invertSelf() {
        this.domMatrix.invertSelf();
        return this;
    }

    transformPoint(x: number, y: number): { x: number; y: number } {
        const m = this.domMatrix;
        return {
            x: x * m.a + y * m.c + m.e,
            y: x * m.b + y * m.d + m.f,
        };
    }

    transformBBox(bbox: BBox, target?: BBox): BBox {
        const m = this.domMatrix;
        const h_w = bbox.width * 0.5;
        const h_h = bbox.height * 0.5;
        const cx = bbox.x + h_w;
        const cy = bbox.y + h_h;

        const w = Math.abs(h_w * m.a) + Math.abs(h_h * m.c);
        const h = Math.abs(h_w * m.b) + Math.abs(h_h * m.d);

        target ??= new BBox(0, 0, 0, 0);

        target.x = cx * m.a + cy * m.c + m.e - w;
        target.y = cx * m.b + cy * m.d + m.f - h;
        target.width = w + w;
        target.height = h + h;

        return target;
    }

    toContext(ctx: CanvasTransform) {
        const m = this.domMatrix;
        if (!m.isIdentity) {
            ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
        }
    }

    private static instance?: Matrix;
    static flyweight(sourceMatrix: Matrix): Matrix {
        Matrix.instance ??= new Matrix();
        return Matrix.instance.setElements(sourceMatrix.elements);
    }

    static fromContext(ctx: CanvasTransform) {
        const domMatrix = ctx.getTransform();
        return new Matrix([domMatrix.a, domMatrix.b, domMatrix.c, domMatrix.d, domMatrix.e, domMatrix.f]);
    }

    static calculateTransformMatrix(
        scaleX: number,
        scaleY: number,
        rotation: number,
        translateX: number,
        translateY: number,
        scalePivotX?: number | null,
        scalePivotY?: number | null,
        rotationPivotX?: number | null,
        rotationPivotY?: number | null
    ): [number, number, number, number, number, number] {
        let scaleOriginX: number, scaleOriginY: number, rotationOriginX: number, rotationOriginY: number;

        if (scaleX === 1 && scaleY === 1) {
            scaleOriginX = scaleOriginY = 0;
        } else {
            scaleOriginX = scalePivotX ?? 0;
            scaleOriginY = scalePivotY ?? 0;
        }

        if (rotation === 0) {
            rotationOriginX = rotationOriginY = 0;
        } else {
            rotationOriginX = rotationPivotX ?? 0;
            rotationOriginY = rotationPivotY ?? 0;
        }

        const scaleAdjustX = scaleOriginX * (1 - scaleX) - rotationOriginX;
        const scaleAdjustY = scaleOriginY * (1 - scaleY) - rotationOriginY;
        const cosTheta = Math.cos(rotation);
        const sinTheta = Math.sin(rotation);

        return [
            cosTheta * scaleX,
            sinTheta * scaleX,
            -sinTheta * scaleY,
            cosTheta * scaleY,
            cosTheta * scaleAdjustX - sinTheta * scaleAdjustY + rotationOriginX + translateX,
            sinTheta * scaleAdjustX + cosTheta * scaleAdjustY + rotationOriginY + translateY,
        ];
    }
}
