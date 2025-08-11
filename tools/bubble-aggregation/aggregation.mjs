const FILTER_DATUM_THRESHOLD = 5;
const FILTER_RANGE_THRESHOLD = 0.05;

function getPrimaryDatum(data, x0, y0, x1, y1) {
    let currentDatum = 0;
    let currentDistanceSquared = Infinity;
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    for (const datum of data) {
        const { x, y } = datum;

        const distanceSquared = (x - midX) ** 2 + (y - midY) ** 2;
        if (distanceSquared < currentDistanceSquared) {
            currentDistanceSquared = distanceSquared;
            currentDatum = datum;
        }
    }
    return currentDatum;
}

function quadChildren(data, x0, y0, x1, y1) {
    const childBuckets = [
        { x0: 1, y0: 1, x1: 0, y1: 0, data: [] },
        { x0: 1, y0: 1, x1: 0, y1: 0, data: [] },
        { x0: 1, y0: 1, x1: 0, y1: 0, data: [] },
        { x0: 1, y0: 1, x1: 0, y1: 0, data: [] },
    ];

    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    for (const datum of data) {
        const { x, y } = datum;

        const childIndex = (x > midX ? 1 : 0) + (y > midY ? 2 : 0);
        const childBucket = childBuckets[childIndex];
        childBucket.data.push(datum);
        childBucket.x0 = Math.min(childBucket.x0, x);
        childBucket.y0 = Math.min(childBucket.y0, y);
        childBucket.x1 = Math.max(childBucket.x1, x);
        childBucket.y1 = Math.max(childBucket.y1, y);
    }

    const children = [];
    for (const childBucket of childBuckets) {
        const { data: cData, x0: cx0, x1: cx1, y0: cy0, y1: cy1 } = childBucket;
        if (cData.length === 0) continue;

        const child = aggregateQuad(cData, cx0, cy0, cx1, cy1);
        children.push(child);
    }

    return children;
}

export function aggregateQuad(data, x0, y0, x1, y1) {
    const terminate =
        (data.length < FILTER_DATUM_THRESHOLD &&
            x1 - x0 < FILTER_RANGE_THRESHOLD &&
            y1 - y0 < FILTER_RANGE_THRESHOLD) ||
        (x0 === x1 && y0 === y1);

    let children = terminate ? null : quadChildren(data, x0, y0, x1, y1);

    if (children?.length === 1) {
        // Flatten the tree if there's only one child
        return children[0];
    } else if (children?.length === 0) {
        children = null;
    }

    const scale = Math.hypot(x1 - x0, y1 - y0);
    const primaryDatum = getPrimaryDatum(data, x0, y0, x1, y1);
    return { scale, x0, y0, x1, y1, data, primaryDatum, children };
}
