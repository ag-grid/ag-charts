const twoPi = Math.PI * 2;

/**
 * Normalize the given angle to be in the [0, 2π) interval.
 * @param radians Angle in radians.
 */
export function normalizeAngle360(radians: number): number {
    radians %= twoPi;
    radians += twoPi;
    radians %= twoPi;
    return radians;
}

export function normalizeAngle360Inclusive(radians: number): number {
    radians %= twoPi;
    radians += twoPi;
    if (radians !== twoPi) {
        radians %= twoPi;
    }
    return radians;
}

/**
 * Normalize the given angle to be in the [-π, π) interval.
 * @param radians Angle in radians.
 */
export function normalizeAngle180(radians: number): number {
    radians %= twoPi;
    if (radians < -Math.PI) {
        radians += twoPi;
    } else if (radians >= Math.PI) {
        radians -= twoPi;
    }
    return radians;
}

export function toRadians(degrees: number): number {
    return (degrees / 180) * Math.PI;
}

export function toDegrees(radians: number): number {
    return (radians / Math.PI) * 180;
}

/**
 * Returns a rotation angle between two other angles.
 * @param angle0 Angle in radians.
 * @param angle1 Angle in radians.
 * @returns Angle in radians.
 */
export function angleBetween(angle0: number, angle1: number) {
    angle0 = normalizeAngle360(angle0);
    angle1 = normalizeAngle360(angle1);
    return angle1 - angle0 + (angle0 > angle1 ? 2 * Math.PI : 0);
}
