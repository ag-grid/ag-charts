import type { Point } from '../types/commonTypes';

export class Matrix {
    static fromContext(ctx: CanvasTransform) {
        const { a, b, c, d, e, f } = ctx.getTransform();
        return new Matrix([a, b, c, d, e, f]);
    }

    constructor(private readonly elements = [1, 0, 0, 1, 0, 0]) {}

    setElements(elements: number[]): this {
        // `this.elements = elements.slice()` is 4-5 times slower
        // (in Chrome 71 and FF 64) than manually copying elements,
        // since slicing allocates new memory.
        // The performance of passing parameters individually
        // vs as an array is about the same in both browsers, so we
        // go with a single (array of elements) parameter, because
        // `setElements(elements)` and `setElements([a, b, c, d, e, f])`
        // calls give us roughly the same performance, versus
        // `setElements(...elements)` and `setElements(a, b, c, d, e, f)`,
        // where the spread operator causes a 20-30x performance drop
        // (30x when compiled to ES5's `.apply(this, elements)`
        //  20x when used natively).

        const el = this.elements;

        el[0] = elements[0];
        el[1] = elements[1];
        el[2] = elements[2];
        el[3] = elements[3];
        el[4] = elements[4];
        el[5] = elements[5];

        return this;
    }

    get isIdentity(): boolean {
        const el = this.elements;
        return el[0] === 1 && el[1] === 0 && el[2] === 0 && el[3] === 1 && el[4] === 0 && el[5] === 0;
    }

    multiplySelf(other: Matrix): this {
        this.AxB(this.elements, other.elements);
        return this;
    }

    preMultiplySelf(other: Matrix): this {
        this.AxB(other.elements, this.elements, this.elements);
        return this;
    }

    invertSelf(): this {
        const el = this.elements;
        let a = el[0];
        let b = el[1];
        let c = el[2];
        let d = el[3];
        const e = el[4];
        const f = el[5];
        const rD = 1 / (a * d - b * c); // reciprocal of determinant

        a *= rD;
        b *= rD;
        c *= rD;
        d *= rD;

        el[0] = d;
        el[1] = -b;
        el[2] = -c;
        el[3] = a;
        el[4] = c * f - d * e;
        el[5] = b * e - a * f;

        return this;
    }

    applyTransform(ctx: CanvasTransform) {
        if (!this.isIdentity) {
            const el = this.elements;
            ctx.transform(el[0], el[1], el[2], el[3], el[4], el[5]);
        }
    }

    transformPoint(x: number, y: number): Point {
        const el = this.elements;
        return {
            x: x * el[0] + y * el[2] + el[4],
            y: x * el[1] + y * el[3] + el[5],
        };
    }

    private AxB(A: number[], B: number[], C?: number[]) {
        const a = A[0] * B[0] + A[2] * B[1];
        const b = A[1] * B[0] + A[3] * B[1];
        const c = A[0] * B[2] + A[2] * B[3];
        const d = A[1] * B[2] + A[3] * B[3];
        const e = A[0] * B[4] + A[2] * B[5] + A[4];
        const f = A[1] * B[4] + A[3] * B[5] + A[5];

        C ??= A;
        C[0] = a;
        C[1] = b;
        C[2] = c;
        C[3] = d;
        C[4] = e;
        C[5] = f;
    }
}
