/** A key in a grouped category axis — an array of nullable labels representing the path through the hierarchy. */
export type GroupedCategoryKey = (string | null)[];

/**
 * The tree layout is calculated in abstract x/y coordinates, where the root is at (0, 0)
 * and the tree grows downward from the root.
 */

class TreeNode {
    position: number = 0;
    subtreeLeft: number = Number.NaN;
    subtreeRight: number = Number.NaN;
    children: TreeNode[] = [];
    leafCount: number = 0;
    depth: number;
    prelim: number = 0;
    mod: number = 0;
    ancestor = this;
    change: number = 0;
    shift: number = 0;
    index: number = 0;
    separatorDepth: number = 0;
    leftmostLeaf: TreeNode = this;
    // screen is meant to be recomputed from (layout) when the tree is resized (without performing another layout)
    screen: number = 0;

    constructor(
        public label: string | null = '',
        public parent?: TreeNode,
        public refId?: number
    ) {
        this.depth = parent ? parent.depth + 1 : 0;
    }

    insertTick(tick: GroupedCategoryKey, index: number) {
        let current: TreeNode = this;
        let endNode: TreeNode | undefined;
        for (let i = 0; i < tick.length; i++) {
            const pathPart = tick[i];
            const isNotLeaf = i !== tick.length - 1;
            const { children } = current;
            const existingNode = children.find((child) => child.label === pathPart);
            if (existingNode && isNotLeaf) {
                // the isNotLeaf check is to allow duplicate leafs
                current = existingNode;
                endNode = existingNode;
            } else {
                const node = new TreeNode(pathPart, current, index);
                node.index = children.length;
                children.push(node);
                if (isNotLeaf) {
                    current = node;
                }
                endNode = node;
            }
        }
        return endNode;
    }

    getLeftSibling(): TreeNode | undefined {
        return this.index > 0 ? this.parent?.children[this.index - 1] : undefined;
    }

    getLeftmostSibling(): TreeNode | undefined {
        return this.index > 0 ? this.parent?.children[0] : undefined;
    }

    // traverse the left contour of a subtree, return the successor of v on this contour
    nextLeft(): TreeNode | undefined {
        return this.children[0];
    }
    // traverse the right contour of a subtree, return the successor of v on this contour
    nextRight(): TreeNode | undefined {
        return this.children.at(-1);
    }

    getSiblings(): TreeNode[] {
        return this.parent?.children.filter((_, i) => i !== this.index) ?? [];
    }
}

/**
 * Converts an array of ticks, where each tick has an array of labels, to a label tree.
 * Ensures that every branch matches the depth of the tree by creating empty labels.
 */
function ticksToTree(ticks: GroupedCategoryKey[]): { root: TreeNode; tickNodes: Map<GroupedCategoryKey, TreeNode> } {
    const maxDepth = ticks.reduce((depth, tick) => Math.max(depth, tick.length), 0);
    const root = new TreeNode();
    const tickNodes = new Map<GroupedCategoryKey, TreeNode>();
    for (let i = 0; i < ticks.length; i++) {
        const tick = ticks[i];
        while (tick.length < maxDepth) {
            tick.push('');
        }
        const node = root.insertTick(tick, i);
        if (node != null) {
            tickNodes.set(tick, node);
        }
    }
    return { root, tickNodes };
}

// Shift the subtree.
function moveSubtree(wm: TreeNode, wp: TreeNode, shift: number) {
    const subtrees = wp.index - wm.index;
    const ratio = shift / subtrees;
    wp.change -= ratio;
    wp.shift += shift;
    wm.change += ratio;
    wp.prelim += shift;
    wp.mod += shift;
}

function ancestor(vim: TreeNode, v: TreeNode, defaultAncestor: TreeNode): TreeNode {
    return v.getSiblings().includes(vim.ancestor) ? vim.ancestor : defaultAncestor;
}

// Spaces out the children.
function executeShifts({ children }: TreeNode) {
    let shift = 0;
    let change = 0;

    for (let i = children.length - 1; i >= 0; i--) {
        const w = children[i];
        w.prelim += shift;
        w.mod += shift;
        change += w.change;
        shift += w.shift + change;
    }
}

// Moves current subtree with v as the root if some nodes are conflicting in space.
function apportion(v: TreeNode, defaultAncestor: TreeNode) {
    const w = v.getLeftSibling();

    if (w) {
        let vop = v;
        let vip = v;
        let vim = w;
        let vom = vip.getLeftmostSibling()!;
        let sip = vip.mod;
        let sop = vop.mod;
        let sim = vim.mod;
        let som = vom.mod;

        while (vim.nextRight() && vip.nextLeft()) {
            vim = vim.nextRight()!;
            vip = vip.nextLeft()!;
            vom = vom.nextLeft()!;
            vop = vop.nextRight()!;
            vop.ancestor = v;
            const shift = vim.prelim + sim - (vip.prelim + sip) + 1;
            if (shift > 0) {
                moveSubtree(ancestor(vim, v, defaultAncestor), v, shift);
                sip += shift;
                sop += shift;
            }
            sim += vim.mod;
            sip += vip.mod;
            som += vom.mod;
            sop += vop.mod;
        }

        if (vim.nextRight() && !vop.nextRight()) {
            vop.mod += sim - sop;
        } else {
            if (vip.nextLeft() && !vom.nextLeft()) {
                vom.mod += sip - som;
            }
            defaultAncestor = v;
        }
    }

    return defaultAncestor;
}

// Compute the preliminary x-coordinate of node and its children (recursively).
function firstWalk(node: TreeNode) {
    const { children } = node;

    if (children.length) {
        let [defaultAncestor] = children;
        for (const child of children) {
            firstWalk(child);
            defaultAncestor = apportion(child, defaultAncestor);
        }
        executeShifts(node);

        const midpoint = (children[0].prelim + children.at(-1)!.prelim) / 2;
        const leftSibling = node.getLeftSibling();
        if (leftSibling) {
            node.prelim = leftSibling.prelim + 1;
            node.mod = node.prelim - midpoint;
        } else {
            node.prelim = midpoint;
        }
    } else {
        const leftSibling = node.getLeftSibling();
        node.prelim = leftSibling ? leftSibling.prelim + 1 : 0;
    }
}

function secondWalk(v: TreeNode, m: number, layout: TreeLayout) {
    v.position = v.prelim + m;
    v.separatorDepth = v.index === 0 ? 1 + (v.parent?.separatorDepth ?? 0) : 0;
    layout.insertNode(v);
    for (const w of v.children) {
        secondWalk(w, m + v.mod, layout);
    }
}

// After the second walk the parent nodes are positioned at the centre of their immediate children.
// If we want the parent nodes to be positioned at the centre of the subtree for which they are roots,
// we need a third walk to adjust the positions.
function thirdWalk(v: TreeNode) {
    const { children } = v;
    let leafCount = 0;
    for (const w of children) {
        thirdWalk(w);
        if (w.children.length) {
            leafCount += w.leafCount;
        } else {
            leafCount++;
        }
    }
    v.leafCount = leafCount;
    if (children.length) {
        v.subtreeLeft = children[0].subtreeLeft;
        v.subtreeRight = children.at(-1)!.subtreeRight;
        v.position = (v.subtreeLeft + v.subtreeRight) / 2;
        v.leftmostLeaf = children[0].leftmostLeaf;
    } else {
        v.subtreeLeft = v.position;
        v.subtreeRight = v.position;
    }
}

export function treeLayout(ticks: GroupedCategoryKey[]): {
    layout: TreeLayout;
    tickNodes: Map<GroupedCategoryKey, TreeNode>;
} {
    const layout = new TreeLayout();

    const { root, tickNodes } = ticksToTree(ticks);

    firstWalk(root);
    secondWalk(root, -root.prelim, layout);
    thirdWalk(root);

    return { layout, tickNodes };
}

export class TreeLayout {
    private minPosition = Infinity;
    private maxPosition = -Infinity;

    public nodes: TreeNode[] = [];
    public depth: number = 0;

    insertNode(node: TreeNode) {
        if (this.depth < node.depth) {
            this.depth = node.depth;
        }
        if (node.position < this.minPosition) {
            this.minPosition = node.position;
        }
        if (node.position > this.maxPosition) {
            this.maxPosition = node.position;
        }
        this.nodes.push(node);
    }

    private scaling(extent: number, flip?: boolean) {
        let scaling = 1;
        if (extent > 0 && this.maxPosition !== this.minPosition) {
            scaling = extent / (this.maxPosition - this.minPosition);
        }
        if (flip) {
            scaling *= -1;
        }
        return scaling;
    }

    resize(range: number[], step: number, inset: number, bandwidth: number) {
        const width = Math.abs(range[1] - range[0]) - step;
        const scaling = this.scaling(width, range[0] > range[1]);
        const shift = inset + bandwidth / 2;

        let offset = 0;
        for (const node of this.nodes) {
            const screen = node.position * scaling;
            if (offset > screen) {
                offset = screen;
            }
            node.screen = screen + shift;
        }

        // Normalize so that root top and leftmost leaf starts at zero.
        for (const node of this.nodes) {
            node.screen -= offset;
        }
    }
}
