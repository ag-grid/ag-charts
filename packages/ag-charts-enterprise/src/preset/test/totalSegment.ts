import { deproxy } from 'ag-charts-community-test';
import type { Rect, Text } from 'ag-charts-core';

interface SceneNode {
    readonly name?: string;
    readonly visible?: boolean;
    children?: () => Iterable<SceneNode>;
}

/** The nodes of the live scene named `name`, as drawn by the `axisInsetValue` plugin. */
export function findSceneNodes<T extends SceneNode>(chart: Parameters<typeof deproxy>[0], name: string): T[] {
    const found: T[] = [];
    const visit = (node: SceneNode) => {
        if (node.name === name) found.push(node as T);
        for (const child of node.children?.() ?? []) visit(child);
    };
    visit((deproxy(chart).ctx.scene as unknown as { root: SceneNode }).root);
    return found;
}

export const totalSegmentBlocks = (chart: Parameters<typeof deproxy>[0]) =>
    findSceneNodes<Rect>(chart, 'axis-inset-value-block').filter((node) => node.visible !== false);

export const totalSegmentLabels = (chart: Parameters<typeof deproxy>[0]) =>
    findSceneNodes<Text>(chart, 'axis-inset-value-label').filter((node) => node.visible !== false);
