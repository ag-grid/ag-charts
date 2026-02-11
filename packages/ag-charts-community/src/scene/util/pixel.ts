const HALF_PIXEL_EPSILON = 1e-8;

function roundToDevicePixel(pixelRatio: number, value: number) {
    const scaled = value * pixelRatio;
    const fractional = scaled - Math.floor(scaled);
    const stable = Math.abs(fractional - 0.5) < HALF_PIXEL_EPSILON ? scaled + HALF_PIXEL_EPSILON : scaled;
    return Math.round(stable) / pixelRatio;
}

export function align(pixelRatio: number, start: number, length?: number) {
    const alignedStart = roundToDevicePixel(pixelRatio, start);

    if (length == null) {
        return alignedStart;
    } else if (length === 0) {
        return 0;
    } else if (length < 1) {
        // Avoid hiding crisp shapes
        return alignAfter(pixelRatio, length);
    }

    // Account for the rounding of alignedStart by increasing length to compensate before alignment.
    return roundToDevicePixel(pixelRatio, length + start) - alignedStart;
}

export function alignBefore(pixelRatio: number, value: number) {
    return Math.floor(value * pixelRatio) / pixelRatio;
}

export function alignAfter(pixelRatio: number, value: number) {
    return Math.ceil(value * pixelRatio) / pixelRatio;
}
