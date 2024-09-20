import type { ElementProvider } from '../components/componentTypes';

interface Hierarchy {
    element: ElementProvider;
    parent?: string;
}

export interface HierarchyProvider {
    getHierarchyChildren(): Array<Partial<HierarchyProvider> & ElementProvider>;
    onHierarchyRemoveFocus?(): void;
}

const ROOT_ELEMENT_ID = 'root';

export class DOMHierarchyManager {
    private readonly hierarchy: Map<string, Hierarchy>;
    private activeElementId: string = ROOT_ELEMENT_ID;

    constructor(root: ElementProvider) {
        this.hierarchy = new Map([[ROOT_ELEMENT_ID, { element: root }]]);
    }

    attach(branch: Partial<HierarchyProvider> & ElementProvider) {
        this.attachBranch(branch);
    }

    private attachBranch(branch: Partial<HierarchyProvider> & ElementProvider, parent?: string) {
        const elementId = branch.getElementId();
        const hierarchyId = parent ? `${parent}__${elementId}` : elementId;

        if (this.hierarchy.has(hierarchyId)) {
            throw new Error('...');
        }

        this.hierarchy.set(hierarchyId, {
            element: branch,
            parent: parent ?? ROOT_ELEMENT_ID,
        });

        const children = branch.getHierarchyChildren?.();
        if (!children) return;

        for (const child of children) {
            this.attachBranch(child, elementId);
        }
    }

    giveFocus(element: ElementProvider) {
        const { activeElementId } = this;
        const elementId = element.getElementId();

        if (elementId === activeElementId) return;

        const node = this.hierarchy.get(elementId);
        if (!node) {
            throw new Error('...');
        }

        const activeNode = this.hierarchy.get(activeElementId);
        if (activeNode) {
            this.removeFocus(activeNode.element);

            if (activeNode.parent != null && activeNode.parent !== node.parent) {
                const parent = this.hierarchy.get(activeNode.parent);
                if (parent) this.removeFocus(parent.element);
            }
        }

        // collapse tree from active
        let parent;
        while (parent !== ROOT_ELEMENT_ID && parent !== node.parent) {
            const node = this.hierarchy.get(activeElementId);
            if (node) {
                this.removeFocus(node.element);
                parent = node.parent;
            } else {
                parent = ROOT_ELEMENT_ID;
            }
        }

        // expand tree to element

        this.activeElementId = element.getElementId();
    }

    removeFocus(element: ElementProvider) {}
}
