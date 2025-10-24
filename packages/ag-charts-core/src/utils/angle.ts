const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI / 2;

/** Normalize an angle into the [0, 2π) interval. */
export function normalizeAngle360(radians: number): number {
    radians %= TWO_PI;
    radians += TWO_PI;
    radians %= TWO_PI;
    return radians;
}

/** Normalize an angle into the [0, 2π] interval (inclusive). */
export function normalizeAngle360Inclusive(radians: number): number {
    radians %= TWO_PI;
    radians += TWO_PI;
    if (radians !== TWO_PI) {
        radians %= TWO_PI;
    }
    return radians;
}

/** Normalize an angle into the [-π, π) interval. */
export function normalizeAngle180(radians: number): number {
    radians %= TWO_PI;
    if (radians < -Math.PI) {
        radians += TWO_PI;
    } else if (radians >= Math.PI) {
        radians -= TWO_PI;
    }
    return radians;
}

export function isBetweenAngles(targetAngle: number, startAngle: number, endAngle: number): boolean {
    const t = normalizeAngle360(targetAngle);
    const a0 = normalizeAngle360(startAngle);
    const a1 = normalizeAngle360(endAngle);

    if (a0 < a1) {
        return a0 <= t && t <= a1;
    } else if (a0 > a1) {
        return a0 <= t || t <= a1;
    } else {
        return startAngle !== endAngle;
    }
}

export function toRadians(degrees: number): number {
    return (degrees / 180) * Math.PI;
}

export function toDegrees(radians: number): number {
    return (radians / Math.PI) * 180;
}

export function angleBetween(angle0: number, angle1: number): number {
    angle0 = normalizeAngle360(angle0);
    angle1 = normalizeAngle360(angle1);
    return angle1 - angle0 + (angle0 > angle1 ? TWO_PI : 0);
}

export function getAngleRatioRadians(angle: number): number {
    const normalizedAngle = normalizeAngle360(angle);
    if (normalizedAngle <= HALF_PI) {
        return normalizedAngle / HALF_PI;
    } else if (normalizedAngle <= Math.PI) {
        return (Math.PI - normalizedAngle) / HALF_PI;
    } else if (normalizedAngle <= 1.5 * Math.PI) {
        return (normalizedAngle - Math.PI) / HALF_PI;
    } else {
        return (TWO_PI - normalizedAngle) / HALF_PI;
    }
}

export function angularPadding(hPadding: number, vPadding: number, angle: number) {
    const angleRatio = getAngleRatioRadians(angle);
    return hPadding * angleRatio + vPadding * Math.abs(1 - angleRatio);
}

export function normalizeAngle360FromDegrees(degrees?: number): number {
    return degrees ? normalizeAngle360(toRadians(degrees)) : 0;
}
