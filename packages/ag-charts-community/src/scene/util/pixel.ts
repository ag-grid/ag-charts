export function align(pixelRatio: number, start: number, length?: number) {
    const alignedStart = Math.round(start * pixelRatio) / pixelRatio;

    if (length == null) {
        return alignedStart;
    } else if (length === 0) {
        return 0;
    } else if (length < 1) {
        // Avoid hiding crisp shapes
        return Math.ceil(length * pixelRatio) / pixelRatio;
    }

    // Account for the rounding of alignedStart by increasing length to compensate before alignment.
    return Math.round((length + start) * pixelRatio) / pixelRatio - alignedStart;
}

export function alignBefore(pixelRatio: number, start: number) {
    return Math.floor(start * pixelRatio) / pixelRatio;
}
