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

export function isBetweenAngles(targetAngle: number, startAngle: number, endAngle: number): boolean {
    // The challenge with this problem is handling paths that cross the angle where the circle
    // wraps (0 or 2π). The logic is different if the path wraps or doesn't
    const t = normalizeAngle360(targetAngle);
    const a0 = normalizeAngle360(startAngle);
    const a1 = normalizeAngle360(endAngle);

    if (a0 < a1) {
        return a0 <= t && t <= a1; // clockwise no wrapping
    } else if (a0 > a1) {
        return a0 <= t || t <= a1; // clockwise with wrapping
    } else {
        return true; // input angles of a 360-spin
    }
}

export function toRadians(degrees: number): number {
    return (degrees / 180) * Math.PI;
}

export function toDegrees(radians: number): number {
    return (radians / Math.PI) * 180;
}

export function angleDiff(angle0: number, angle1: number, counterClockwise: boolean) {
    if (counterClockwise) {
        [angle0, angle1] = [angle1, angle0];
    }
    const a0 = normalizeAngle360(angle0);
    const a1 = normalizeAngle360(angle1) + twoPi;
    return (a1 - a0) % twoPi;
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

export function displacePointFromVector(
    centerX: number,
    centerY: number,
    radius: number,
    angle: number
): { x: number; y: number } {
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { x, y };
}
