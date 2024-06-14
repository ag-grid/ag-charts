export const Vec2 = {
    add,
    sub,
    equal,
    fromOffset,
    apply,
    required,
};

interface Vec2 {
    x: number;
    y: number;
}

interface OffsetVec2 {
    offsetX: number;
    offsetY: number;
}

function add(a: Vec2, b: Vec2): Vec2 {
    return { x: a.x + b.x, y: a.y + b.y };
}

function sub(a: Vec2, b: Vec2): Vec2 {
    return { x: a.x - b.x, y: a.y - b.y };
}

function equal(a: Vec2, b: Vec2): boolean {
    return a.x === b.x && a.y === b.y;
}

function fromOffset(a: OffsetVec2): Vec2 {
    return { x: a.offsetX, y: a.offsetY };
}

function apply(a: Partial<Vec2>, b: Vec2): Vec2 {
    a.x = b.x;
    a.y = b.y;
    return a as Vec2;
}

function required(a?: Partial<Vec2>): Vec2 {
    return { x: a?.x ?? 0, y: a?.y ?? 0 };
}
