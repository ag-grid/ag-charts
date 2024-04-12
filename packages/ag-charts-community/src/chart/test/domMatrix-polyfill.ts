export class DOMMatrix {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;

    constructor(elements = [1, 0, 0, 1, 0, 0]) {
        this.a = elements[0];
        this.b = elements[1];
        this.c = elements[2];
        this.d = elements[3];
        this.e = elements[4];
        this.f = elements[5];
    }

    get isIdentity() {
        return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
    }

    multiplySelf(other: DOMMatrix) {
        this.AxB(this, other);
        return this;
    }

    preMultiplySelf(other: DOMMatrix) {
        this.AxB(other, this, this);
        return this;
    }

    /**
     * Returns the inverse of this matrix as a new matrix.
     */
    inverse() {
        let { a, b, c, d } = this;
        const { e, f } = this;
        const rD = 1 / (a * d - b * c); // reciprocal of determinant

        a *= rD;
        b *= rD;
        c *= rD;
        d *= rD;

        return new DOMMatrix([d, -b, -c, a, c * f - d * e, b * e - a * f]);
    }

    invertSelf() {
        let { a, b, c, d } = this;
        const { e, f } = this;
        const rD = 1 / (a * d - b * c); // reciprocal of determinant

        a *= rD;
        b *= rD;
        c *= rD;
        d *= rD;

        this.a = d;
        this.b = -b;
        this.c = -c;
        this.d = a;
        this.e = c * f - d * e;
        this.f = b * e - a * f;

        return this;
    }

    private AxB(A: DOMMatrix, B: DOMMatrix, C?: DOMMatrix) {
        const a = A.a * B.a + A.c * B.b;
        const b = A.b * B.a + A.d * B.b;
        const c = A.a * B.c + A.c * B.d;
        const d = A.b * B.c + A.d * B.d;
        const e = A.a * B.e + A.c * B.f + A.e;
        const f = A.b * B.e + A.d * B.f + A.f;

        C ??= A;
        C.a = a;
        C.b = b;
        C.c = c;
        C.d = d;
        C.e = e;
        C.f = f;
    }
}
