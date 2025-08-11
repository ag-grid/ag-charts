import { aggregateQuad } from './aggregation.mjs';
import { getOpacity } from './canvas.mjs';
import { getData } from './data.mjs';

const aggregation = aggregateQuad(getData(10_000), 0, 0, 1, 1);

const csv = [`count,area,opacity`];

const queue = [aggregation];
while (queue.length > 0) {
    const current = queue.shift();

    if (current.children != null) {
        queue.push(...current.children);
    }

    const count = current.data.length;
    const area = (current.x1 - current.x0) * (current.y1 - current.y0);
    const opacity = getOpacity(current, 0.1);

    csv.push(`${count},${area},${opacity}`);
}

console.log(csv.join('\n'));
