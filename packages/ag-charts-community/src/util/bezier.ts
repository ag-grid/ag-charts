// Find the extreme points where the derivative is zero
export function calculateDerivativeExtrema(p0: number, p1: number, p2: number, p3: number): number[] {
    const a = -p0 + 3 * p1 - 3 * p2 + p3;
    const b = 3 * p0 - 6 * p1 + 3 * p2;
    const c = -3 * p0 + 3 * p1;

    if (a === 0) {
        if (b !== 0) {
            const t = -c / b;
            if (t > 0 && t < 1) {
                return [t];
            }
        }
        return [];
    }

    const discriminant = b * b - 4 * a * c;
    if (discriminant >= 0) {
        const sqrtDiscriminant = Math.sqrt(discriminant);
        const t1 = (-b + sqrtDiscriminant) / (2 * a);
        const t2 = (-b - sqrtDiscriminant) / (2 * a);
        return [t1, t2].filter((t) => t > 0 && t < 1);
    }

    return [];
}

export function calculateDerivativeExtremaXY(
    sx: number,
    sy: number,
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
): number[] {
    const tx = calculateDerivativeExtrema(sx, cp1x, cp2x, x);
    const ty = calculateDerivativeExtrema(sy, cp1y, cp2y, y);
    return [...tx, ...ty];
}

export function bezierAt(p0: number, p1: number, p2: number, p3: number, t: number): number {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}
