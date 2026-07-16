const HALF_PIXEL_EPSILON = 1e-8;

/**
 * Round `value * pixelRatio` to a whole device pixel, nudging exact half-pixel ties up so tiny
 * floating-point jitter near a `.5` boundary does not flip the result ±1px across recomputations.
 */
export function deviceDimension(pixelRatio: number, value: number) {
    const scaled = value * pixelRatio;
    const fractional = scaled - Math.floor(scaled);
    const stable = Math.abs(fractional - 0.5) < HALF_PIXEL_EPSILON ? scaled + HALF_PIXEL_EPSILON : scaled;
    return Math.round(stable);
}

function roundToDevicePixel(pixelRatio: number, value: number) {
    return deviceDimension(pixelRatio, value) / pixelRatio;
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

export interface AlignedInterval {
    start: number;
    length: number;
}

/**
 * Whether a bar of this logical length is wide enough for the centre-preserving snap to be worthwhile.
 * At or below one device pixel {@link alignCentre} falls back to the edge snap: a single-pixel centre
 * snap offsets the origin by half a device pixel, making the position acutely sensitive to sub-pixel
 * input jitter (e.g. the float noise very large magnitudes produce, AG-16608), and such a thin bar is
 * too narrow for centre alignment to be perceptible.
 */
export function centreSnapApplies(pixelRatio: number, length: number): boolean {
    return deviceDimension(pixelRatio, length) > 1;
}

/**
 * Snaps a band/bar edge-pair to the device grid while preserving its centre: the length is rounded
 * to a whole number of device pixels and the centre is snapped so both edges land on device-pixel
 * boundaries. Odd device-pixel widths snap the centre to a pixel centre (mirroring the odd-stroke
 * offset in `Line.render`); even widths snap it to a boundary. Unlike {@link align}, which snaps the
 * two edges independently and can drift the midpoint by up to half a device pixel, this keeps a bar's
 * centre coincident with its axis tick/gridline.
 *
 * Pass `out` to write into a caller-owned scratch object and avoid per-call allocation on hot paths.
 */
export function alignCentre(
    pixelRatio: number,
    start: number,
    length: number,
    out: AlignedInterval = { start: 0, length: 0 }
): AlignedInterval {
    const lengthDev = deviceDimension(pixelRatio, length);
    if (lengthDev <= 1) {
        // See {@link centreSnapApplies}: thin bars edge-snap to stay stable under sub-pixel jitter.
        out.start = align(pixelRatio, start);
        out.length = align(pixelRatio, start, length);
        return out;
    }
    const centreDev = (start + length / 2) * pixelRatio;
    // Snap the near edge to a whole device pixel via the tie-stable rounder, so both edges land on the
    // grid and the centre lands on the nearest boundary (even device width) or pixel centre (odd). Using
    // deviceDimension here keeps the result stable against sub-ULP jitter near a .5 boundary.
    const startDev = deviceDimension(1, centreDev - lengthDev / 2);
    out.start = startDev / pixelRatio;
    out.length = lengthDev / pixelRatio;
    return out;
}

export function alignBefore(pixelRatio: number, value: number) {
    return Math.floor(value * pixelRatio) / pixelRatio;
}

export function alignAfter(pixelRatio: number, value: number) {
    return Math.ceil(value * pixelRatio) / pixelRatio;
}
