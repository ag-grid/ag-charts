export interface Vec4 {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export const Vec4 = {
    from,
    origin,
};

function from(x1: number, y1: number, x2: number, y2: number): Vec4;
function from(bbox: { x: number; y: number; width: number; height: number }): Vec4;
function from(
    a: number | { x: number; y: number; width: number; height: number },
    b?: number,
    c?: number,
    d?: number
): Vec4 {
    if (typeof a === 'number') {
        return { x1: a, y1: b!, x2: c!, y2: d! };
    }

    if ('width' in a) {
        return {
            x1: a.x,
            y1: a.y,
            x2: a.x + a.width,
            y2: a.y + a.height,
        };
    }

    throw new Error(`Values can not be converted into a vector4: [${a}] [${b}] [${c}] [${d}]`);
}

function origin(): Vec4 {
    return { x1: 0, y1: 0, x2: 0, y2: 0 };
}
