import type { AgContextMenuItem, AgContextMenuItemShowOn, AgContextMenuItemType } from 'ag-charts-community';

/**
 * Merge a union of objects into one object with all the properties. This is just to check at compile-time that
 * ContextMenuItem implements all properties of AgContextMenuItem API contract.
 */
type MergeUnion<T, CanBeUndefined extends keyof T> = {
    [K in T extends any ? keyof T : never]: T extends { [P in K]?: infer V }
        ? K extends CanBeUndefined
            ? V | undefined
            : V
        : never;
};

/**
 * The type of `contextMenu.items[]` recursively references its own type, but our compile-time check only needs a depth
 * of 1. Therefore, limit this depth to 1:
 */
type ContextMenuItem_NonRecursive = Omit<MergeUnion<Extract<AgContextMenuItem, object>, 'iconUrl' | 'action'>, 'items'>;
type ContextMenuItemContract = ContextMenuItem_NonRecursive & { items: ContextMenuItem_NonRecursive[] };

export class ContextMenuItem implements ContextMenuItemContract {
    type: AgContextMenuItemType = 'action';
    showOn: AgContextMenuItemShowOn = 'always';
    label: string = '';
    iconUrl: string | undefined = undefined;
    enable: boolean = true;
    items: ContextMenuItem[] = [];
    action: ContextMenuItemContract['action'] = undefined;
}
