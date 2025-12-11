const twoPi = Math.PI * 2;
const halfPi = Math.PI / 2;

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
        // input angles equal or of a 360-spin
        return startAngle !== endAngle;
    }
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
    return angle1 - angle0 + (angle0 > angle1 ? twoPi : 0);
}

/**
 * Calculates the ratio of an angle in radians based on its proximity to 0, π/2, π, or 3π/2.
 *
 * - 0 and π return ratios decreasing linearly to 0 at these angles.
 * - π/2 and 3π/2 return ratios increasing linearly to 1 at these angles.
 *
 * @param angle - The input angle in radians.
 * @returns The ratio (a number between 0 and 1).
 */
export function getAngleRatioRadians(angle: number): number {
    const normalizedAngle = normalizeAngle360(angle);
    if (normalizedAngle <= halfPi) {
        return normalizedAngle / halfPi;
    } else if (normalizedAngle <= Math.PI) {
        return (Math.PI - normalizedAngle) / halfPi;
    } else if (normalizedAngle <= 1.5 * Math.PI) {
        return (normalizedAngle - Math.PI) / halfPi;
    } else {
        return (twoPi - normalizedAngle) / halfPi;
    }
}

export function angularPadding(hPadding: number, vPadding: number, angle: number) {
    const angleRatio = getAngleRatioRadians(angle);
    return hPadding * angleRatio + vPadding * Math.abs(1 - angleRatio);
}

export function normalizeAngle360FromDegrees(degrees?: number): number {
    return degrees ? normalizeAngle360(toRadians(degrees)) : 0;
}
