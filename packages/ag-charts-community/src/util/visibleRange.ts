export function rescaleVisibleRange(
    visibleRange: [number, number],
    [s0, s1]: [number, number],
    [d0, d1]: [number, number]
): [number, number] {
    const dr = d1 - d0;
    const vr = s1 - s0;
    const vd0 = s0 + vr * visibleRange[0];
    const vd1 = s0 + vr * visibleRange[1];
    return [(vd0 - d0) / dr, (vd1 - d0) / dr];
}
