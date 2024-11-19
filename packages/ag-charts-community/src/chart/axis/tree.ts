/**
 * The tree layout is calculated in abstract x/y coordinates, where the root is at (0, 0)
 * and the tree grows downward from the root.
 */

class Dimensions {
    top: number = Infinity;
    right: number = -Infinity;
    bottom: number = -Infinity;
    left: number = Infinity;

    update(x: number, y: number) {
        if (x > this.right) {
            this.right = x;
        }
        if (x < this.left) {
            this.left = x;
        }
        if (y > this.bottom) {
            this.bottom = y;
        }
        if (y < this.top) {
            this.top = y;
        }
    }
}

class TreeNode {
    x: number = 0;
    y: number = 0;
    subtreeLeft: number = NaN;
    subtreeRight: number = NaN;
    // screenX and screenY are meant to be recomputed from (layout) x and y
    // when the tree is resized (without performing another layout)
    screenX: number = 0;
    screenY: number = 0;
    children: TreeNode[] = [];
    leafCount: number = 0;
    depth: number;
    prelim: number = 0;
    mod: number = 0;
    ancestor = this;
    change: number = 0;
    shift: number = 0;
    index: number = 0;

    constructor(
        public label: string = '',
        public parent?: TreeNode
    ) {
        this.depth = parent ? parent.depth + 1 : 0;
    }

    insertTick(tick: string[]) {
        let root: TreeNode = this;
        for (let i = tick.length - 1; i >= 0; i--) {
            const pathPart = tick[i];
            const isNotLeaf = i !== 0;
            const { children } = root;
            const existingNode = children.find((child) => child.label === pathPart);
            if (existingNode && isNotLeaf) {
                // the isNotLeaf check is to allow duplicate leafs
                root = existingNode;
            } else {
                const node = new TreeNode(pathPart, root);
                node.index = children.length;
                children.push(node);
                if (isNotLeaf) {
                    root = node;
                }
            }
        }
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
export function ticksToTree(ticks: string[][]): TreeNode {
    const maxDepth = ticks.reduce((depth, tick) => (depth < tick.length ? tick.length : depth), 0);
    const root = new TreeNode();
    for (const tick of ticks) {
        while (tick.length < maxDepth) {
            tick.unshift('');
        }
        root.insertTick(tick);
    }
    return root;
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
    return v.getSiblings().indexOf(vim.ancestor) >= 0 ? vim.ancestor : defaultAncestor;
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
    v.x = v.prelim + m;
    v.y = v.depth;
    layout.insertNode(v);
    v.children.forEach((w) => secondWalk(w, m + v.mod, layout));
}

// After the second walk the parent nodes are positioned at the center of their immediate children.
// If we want the parent nodes to be positioned at the center of the subtree for which they are roots,
// we need a third walk to adjust the positions.
function thirdWalk(v: TreeNode) {
    const children = v.children;
    let leafCount = 0;
    children.forEach((w) => {
        thirdWalk(w);
        if (w.children.length) {
            leafCount += w.leafCount;
        } else {
            leafCount++;
        }
    });
    v.leafCount = leafCount;
    if (children.length) {
        v.subtreeLeft = children[0].subtreeLeft;
        v.subtreeRight = children[v.children.length - 1].subtreeRight;
        v.x = (v.subtreeLeft + v.subtreeRight) / 2;
    } else {
        v.subtreeLeft = v.x;
        v.subtreeRight = v.x;
    }
}

export function treeLayout(ticks: string[][]): TreeLayout {
    const layout = new TreeLayout();
    const root = ticksToTree(ticks);

    firstWalk(root);
    secondWalk(root, -root.prelim, layout);
    thirdWalk(root);

    return layout;
}

export class TreeLayout {
    private readonly dimensions = new Dimensions();

    public nodes: TreeNode[] = [];
    public depth: number = 0;

    insertNode(node: TreeNode) {
        if (this.depth < node.depth) {
            this.depth = node.depth;
        }
        this.dimensions.update(node.x, node.y);
        this.nodes.push(node);
    }

    resize(width: number, height: number, shiftX = 0, shiftY = 0, flipX: boolean = false) {
        const { dimensions } = this;

        let scalingX = 1;
        let scalingY = 1;
        if (width > 0) {
            scalingX = width / (dimensions.right - dimensions.left);
            if (flipX) {
                scalingX = -scalingX;
            }
        }
        if (height > 0) {
            scalingY = height / (dimensions.bottom - dimensions.top);
        }

        const screenDimensions = new Dimensions();
        for (const node of this.nodes) {
            node.screenX = node.x * scalingX;
            node.screenY = node.y * scalingY;
            screenDimensions.update(node.screenX, node.screenY);
        }
        // Normalize so that root top and leftmost leaf left start at zero.
        const offsetX = -screenDimensions.left;
        const offsetY = -screenDimensions.top;
        for (const node of this.nodes) {
            node.screenX += offsetX + shiftX;
            node.screenY += offsetY + shiftY;
        }
    }
}
