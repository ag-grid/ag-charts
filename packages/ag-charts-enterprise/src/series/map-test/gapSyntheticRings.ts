import type { Position } from 'ag-charts-core';

import type { GapIndexRegion } from '../map-util/mapShapeGapIndex';

export type Ring = Position[];

/** A closed counter-clockwise (positive shoelace) rectangle. */
export function rect(x0: number, y0: number, x1: number, y1: number): Ring {
    return [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1],
        [x0, y0],
    ];
}

export function reverseRing(ring: Ring): Ring {
    return ring.map(([x, y]): Position => [x, y]).reverse();
}

/** The ring reflected across the y axis and wound counter-clockwise again, so its walk order is mirrored too. */
export function mirrorRing(ring: Ring): Ring {
    return reverseRing(ring.map(([x, y]): Position => [-x, y]));
}

/** The same closed ring, starting `shift` vertices later. */
export function rotateRing(ring: Ring, shift: number): Ring {
    const open = ring.slice(0, -1);
    const k = shift % open.length;
    const rotated = [...open.slice(k), ...open.slice(0, k)].map(([x, y]): Position => [x, y]);
    rotated.push([rotated[0][0], rotated[0][1]]);
    return rotated;
}

export function scaleRing(ring: Ring, scale: number): Ring {
    return ring.map(([x, y]): Position => [x * scale, y * scale]);
}

export function region(hasGap: boolean, ...polygons: Ring[][]): GapIndexRegion {
    return { hasGap, polygons };
}

/** Two squares sharing the edge x = 10. */
export function sideBySide(): { a: Ring; b: Ring } {
    return { a: rect(0, 0, 10, 10), b: rect(10, 0, 20, 10) };
}

/** Three regions meeting at the origin: quadrants I and II above, everything below. */
export function tripoint(): { r1: Ring; r2: Ring; r3: Ring } {
    return {
        r1: [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
        ],
        r2: [
            [0, 0],
            [0, 10],
            [-10, 10],
            [-10, 0],
            [0, 0],
        ],
        r3: [
            [0, 0],
            [-10, 0],
            [-10, -10],
            [10, -10],
            [10, 0],
            [0, 0],
        ],
    };
}

/** `b`'s left edge has an extra vertex at (10, 5), so it only partly matches `a`'s right edge. */
export function tJunction(): { a: Ring; b: Ring } {
    return {
        a: rect(0, 0, 10, 10),
        b: [
            [10, 0],
            [20, 0],
            [20, 10],
            [10, 10],
            [10, 5],
            [10, 0],
        ],
    };
}

/**
 * `a` has a 1-wide, 4-long tooth reaching into `b`, which wraps round it. Every tooth edge is shared, so the tooth is
 * a corridor narrower than any gap larger than 1.
 */
export function tooth(): { a: Ring; b: Ring; width: number } {
    return {
        width: 1,
        a: [
            [0, 0],
            [10, 0],
            [10, 4],
            [14, 4],
            [14, 5],
            [10, 5],
            [10, 10],
            [0, 10],
            [0, 0],
        ],
        b: [
            [10, 0],
            [30, 0],
            [30, 10],
            [10, 10],
            [10, 5],
            [14, 5],
            [14, 4],
            [10, 4],
            [10, 0],
        ],
    };
}

/**
 * `a` meets `b` on the left and `c` on the right along its top. Between them its coast is a 1.4-long ramp, shorter
 * than the slides that both of its ends ask for.
 */
export function rampBetweenBorders(): { a: Ring; b: Ring; c: Ring } {
    return {
        a: [
            [0, 0],
            [20, 0],
            [20, 11],
            [10.5, 11],
            [9.5, 10],
            [0, 10],
            [0, 0],
        ],
        b: [
            [0, 10],
            [9.5, 10],
            [9.5, 20],
            [0, 20],
            [0, 10],
        ],
        c: [
            [10.5, 11],
            [20, 11],
            [20, 20],
            [10.5, 20],
            [10.5, 11],
        ],
    };
}

/**
 * `a` and `b` share a 10-long border whose middle is `count` vertices 0.1 apart, so the vertices are sub-pixel at
 * zoom 1 and 2px apart at zoom 20. `a` walks the border upwards and `b` downwards.
 */
export function microBorder(count = 30): { a: Ring; b: Ring } {
    const border: Position[] = [[10, 0]];
    for (let i = 0; i < count; i += 1) {
        border.push([10 + (i % 2 === 0 ? 0.02 : 0), 4 + i * 0.1]);
    }
    border.push([10, 10]);

    return {
        a: [[0, 0], ...border, [0, 10], [0, 0]],
        b: [...[...border].reverse(), [20, 0], [20, 10], [10, 10]],
    };
}

/**
 * `a` has a 1-wide arm whose top edge is shared with `b` and whose bottom edge and tip are coast, so the arm is a
 * corridor between a moved edge and an unmoved one.
 */
export function coastArm(): { a: Ring; b: Ring; width: number } {
    return {
        width: 1,
        a: [
            [0, 0],
            [10, 0],
            [10, 4],
            [20, 4],
            [20, 5],
            [10, 5],
            [10, 10],
            [0, 10],
            [0, 0],
        ],
        b: rect(10, 5, 20, 10),
    };
}

/** `a` and `b` share a border with an extra collinear vertex at its middle on both rings. */
export function collinearBorder(): { a: Ring; b: Ring } {
    return {
        a: [
            [0, 0],
            [10, 0],
            [10, 5],
            [10, 10],
            [0, 10],
            [0, 0],
        ],
        b: [
            [10, 0],
            [20, 0],
            [20, 10],
            [10, 10],
            [10, 5],
            [10, 0],
        ],
    };
}

/** `a`'s coast leaves the end of its shared border at 2.3 degrees to it. */
export function nearCollinearCoast(): { a: Ring; b: Ring } {
    return {
        a: [
            [0, 0],
            [10, 0],
            [10, 5],
            [10.2, 10],
            [0, 10],
            [0, 0],
        ],
        b: rect(10, 0, 20, 5),
    };
}

/** A sharp reflex notch: `b` pokes a thin tooth into `a` along its shared top border. */
export function thinNotch(): { a: Ring; b: Ring } {
    return {
        a: [
            [0, 0],
            [40, 0],
            [40, 40],
            [21, 40],
            [20, 20],
            [19, 40],
            [0, 40],
            [0, 0],
        ],
        b: [
            [0, 40],
            [19, 40],
            [20, 20],
            [21, 40],
            [40, 40],
            [40, 60],
            [0, 60],
            [0, 40],
        ],
    };
}

/**
 * `a` is a square with a 1.4-long chamfer at its top-right corner. Its right edge, top edge and chamfer are each shared
 * with another region, so the chamfer is a moved edge that reverses once its neighbours are offset.
 */
export function chamferedCorner(): { a: Ring; right: Ring; top: Ring; corner: Ring } {
    return {
        a: [
            [0, 0],
            [10, 0],
            [10, 9],
            [9, 10],
            [0, 10],
            [0, 0],
        ],
        right: [
            [10, 0],
            [20, 0],
            [20, 9],
            [10, 9],
            [10, 0],
        ],
        top: [
            [0, 10],
            [9, 10],
            [9, 20],
            [0, 20],
            [0, 10],
        ],
        corner: [
            [10, 9],
            [10, 10],
            [9, 10],
            [10, 9],
        ],
    };
}

/** A counter-clockwise polygon with `count` vertices, starting at vertex `start`. */
export function circle(count: number, radius: number, start = 0): Ring {
    const ring: Ring = [];
    for (let i = 0; i < count; i += 1) {
        const angle = (2 * Math.PI * ((i + start) % count)) / count;
        ring.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
    }
    ring.push([ring[0][0], ring[0][1]]);
    return ring;
}

/**
 * `a` has a 1-wide tooth. Its top and bottom sides are shared with `b` and `c`, and its 1-long tip is coast. At any
 * `d > 0.5` the slides that both ends of the tip ask for add up to more than the tip is long.
 */
export function narrowCoastTip(): { a: Ring; b: Ring; c: Ring } {
    return {
        a: [
            [0, 0],
            [10, 0],
            [10, 4],
            [14, 4],
            [14, 5],
            [10, 5],
            [10, 10],
            [0, 10],
            [0, 0],
        ],
        b: [
            [10, 5],
            [14, 5],
            [30, 5],
            [30, 10],
            [10, 10],
            [10, 5],
        ],
        c: [
            [10, 0],
            [30, 0],
            [30, 4],
            [14, 4],
            [10, 4],
            [10, 0],
        ],
    };
}

/**
 * `chamferedCorner`'s `a` with a neighbour on every side, so none of its 5 edges is coast, and the chamfer is a moved
 * edge that reverses once its neighbours are offset.
 */
export function fullyNeighbouredChamfer(): { a: Ring; neighbours: Ring[] } {
    const { a, right, top, corner } = chamferedCorner();
    return {
        a,
        neighbours: [right, top, corner, rect(0, -10, 10, 0), rect(-10, 0, 0, 10)],
    };
}

/**
 * A lumpy circular enclave in a host's hole. A third region sits in a second hole of the host and touches the enclave at
 * one vertex, `(radius, 0)`, so the enclave's run round the hole is closed and has exactly one pinned vertex. The lumps
 * make the walk direction matter: a round enclave is the same either way.
 */
export function pinnedEnclave(radius = 5): { enclave: Ring; host: Ring[]; touching: Ring; pin: Position } {
    const enclave = circle(80, radius).map(([x, y], i): Position => {
        const lump = i === 0 || i === 80 ? 1 : 1 + 0.05 * Math.sin(i * i);
        return [x * lump, y * lump];
    });
    const touching: Ring = [
        [radius, 0],
        [radius + 3, -1],
        [radius + 3, 1],
        [radius, 0],
    ];
    return {
        enclave,
        host: [rect(-20, -20, 20, 20), reverseRing(rotateRing(enclave, 17)), reverseRing(touching)],
        touching,
        pin: [radius, 0],
    };
}

/**
 * An open, counter-clockwise ring: a disc of `count` vertices with a needle on its left side, narrowing to a rounded
 * tip 1 wide. The tip holds the ring's lowest coordinate, and every edge of a ring like this one can be moved, so at
 * `d > 0.5` the needle's edges reverse one after another, from the tip inwards.
 */
export function discWithNeedle(count = 400): Ring {
    const radius = 100;
    const ring: Ring = [];
    const gap = Math.PI / 18;
    for (let i = 0; i < count; i += 1) {
        const angle = -Math.PI + gap + ((2 * Math.PI - 2 * gap) * i) / (count - 1);
        ring.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
    }
    // From the last disc vertex (above the needle) out to the tip and back to the first (below it).
    ring.push([-130, 0.5]);
    for (let i = 1; i < 8; i += 1) {
        const angle = Math.PI / 2 + (Math.PI * i) / 8;
        ring.push([-130 + 0.5 * Math.cos(angle), 0.5 * Math.sin(angle)]);
    }
    return ring;
}
