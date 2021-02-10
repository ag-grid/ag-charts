interface Node {
    children: Node[];
    value: number;
    x0: number;
    x1: number;
    y0: number;
    y1: number;
}

function slice(parent: Node, x0: number, y0: number, x1: number, y1: number) {
    const nodes = parent.children;
    const k = parent.value && (y1 - y0) / parent.value;

    nodes.forEach(node => {
        node.x0 = x0;
        node.x1 = x1;
        node.y0 = y0;
        node.y1 = y0 += node.value * k;
    });
}

function dice(parent: Node, x0: number, y0: number, x1: number, y1: number) {
    const nodes = parent.children;
    const k = parent.value && (x1 - x0) / parent.value;

    nodes.forEach(node => {
        node.x0 = x0;
        node.x1 = x0 += node.value * k;
        node.y0 = y0;
        node.y1 = y1;
    })
}

function roundNode(node: Node) {
    node.x0 = Math.round(node.x0);
    node.y0 = Math.round(node.y0);
    node.x1 = Math.round(node.x1);
    node.y1 = Math.round(node.y1);
}

export function squarifyRatio(ratio: number, parent: any, x0: number, y0: number, x1: number, y1: number) {
    const rows: any[] = [];
    const nodes = parent.children;
    const n = nodes.length;
    let value = parent.value;
    let i0: number = 0;
    let i1: number = 0;
    let dx: number;
    let dy: number;
    let nodeValue: number;
    let sumValue: number;
    let minValue: number;
    let maxValue: number;
    let newRatio: number;
    let minRatio: number;
    let alpha: number;
    let beta: number;

    while (i0 < n) {
        dx = x1 - x0;
        dy = y1 - y0;

        // Find the next non-empty node.
        do {
            sumValue = nodes[i1++].value;
        } while (!sumValue && i1 < n);
        minValue = maxValue = sumValue;
        alpha = Math.max(dy / dx, dx / dy) / (value * ratio);
        beta = sumValue * sumValue * alpha;
        minRatio = Math.max(maxValue / beta, beta / minValue);

        // Keep adding nodes while the aspect ratio maintains or improves.
        for (; i1 < n; ++i1) {
            nodeValue = nodes[i1].value;
            sumValue += nodeValue;
            if (nodeValue < minValue) {
                minValue = nodeValue;
            }
            if (nodeValue > maxValue) {
                maxValue = nodeValue;
            }
            beta = sumValue * sumValue * alpha;
            newRatio = Math.max(maxValue / beta, beta / minValue);
            if (newRatio > minRatio) {
                sumValue -= nodeValue;
                break;
            }
            minRatio = newRatio;
        }

        // Position and record the row orientation.
        const row: any = {
            value: sumValue,
            dice: dx < dy,
            children: nodes.slice(i0, i1)
        };
        rows.push(row);
        if (row.dice) {
            dice(row, x0, y0, x1, value ? y0 += dy * sumValue / value : y1);
        } else {
            slice(row, x0, y0, value ? x0 += dx * sumValue / value : x1, y1);
        }
        value -= sumValue;
        i0 = i1;
    }

    return rows;
}

const phi = (1 + Math.sqrt(5)) / 2;
const squarify = (function custom(ratio: number) {
    function squarify(parent: Node, x0: number, y0: number, x1: number, y1: number) {
        squarifyRatio(ratio, parent, x0, y0, x1, y1);
    }

    squarify.ratio = (x: any) => custom((x = +x) > 1 ? x : 1);

    return squarify;
})(phi);

export class Treemap {

    private paddingStack: number[] = [0];

    private dx: number = 1;
    private dy: number = 1;
    set size(size: [number, number]) {
        this.dx = size[0];
        this.dy = size[1];
    }
    get size(): [number, number] {
        return [this.dx, this.dy];
    }

    round: boolean = true;
    tile: (Node: any, x0: number, y0: number, x1: number, y1: number) => any = squarify;
    paddingInner: (node: any) => number = _ => 0;
    paddingTop: (node: any) => number = _ => 0;
    paddingRight: (node: any) => number = _ => 0;
    paddingBottom: (node: any) => number = _ => 0;
    paddingLeft: (node: any) => number = _ => 0;

    processData(root: any): any {
        root.x0 = 0;
        root.y0 = 0;
        root.x1 = this.dx;
        root.y1 = this.dy;

        root.eachBefore(this.positionNode.bind(this));
        this.paddingStack = [0];
        if (this.round) {
            root.eachBefore(roundNode);
        }
        return root;
    }

    positionNode(node: any) {
        let p = this.paddingStack[node.depth];
        let x0 = node.x0 + p;
        let y0 = node.y0 + p;
        let x1 = node.x1 - p;
        let y1 = node.y1 - p;

        if (x1 < x0) {
            x0 = x1 = (x0 + x1) / 2;
        }

        if (y1 < y0) {
            y0 = y1 = (y0 + y1) / 2;
        }

        node.x0 = x0;
        node.y0 = y0;
        node.x1 = x1;
        node.y1 = y1;

        if (node.children) {
            p = this.paddingStack[node.depth + 1] = this.paddingInner(node) / 2;
            x0 += this.paddingLeft(node) - p;
            y0 += this.paddingTop(node) - p;
            x1 -= this.paddingRight(node) - p;
            y1 -= this.paddingBottom(node) - p;

            if (x1 < x0) {
                x0 = x1 = (x0 + x1) / 2;
            }
            if (y1 < y0) {
                y0 = y1 = (y0 + y1) / 2;
            }
            this.tile(node, x0, y0, x1, y1);
        }

    }
}