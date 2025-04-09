import type { AgContextMenuItemLiteral, AgContextMenuItemShowOn, AgContextMenuItemType } from 'ag-charts-community';

import type { ContextMenuItemContract, ContextMenuItemContractNonRecursive } from './contextMenuItemContract';

function createItemFromLiteral(name: AgContextMenuItemLiteral): ContextMenuItem {}

type Options = Partial<ContextMenuItemContractNonRecursive>;

export class ContextMenuItem implements ContextMenuItemContract {
    type: AgContextMenuItemType = 'action';
    showOn: AgContextMenuItemShowOn = 'always';
    label: string = '';
    iconUrl: string | undefined = undefined;
    enable: boolean = true;
    items: ContextMenuItem[] = [];
    action: ContextMenuItemContract['action'] = undefined;

    private setField<K extends keyof Options>(key: K, that: { [L in K]: Options[K] }, value: Options[K]): void {
        that[key] = value;
    }

    setValues(values: Options) {
        let key: keyof typeof values & keyof ContextMenuItem;
        for (key in values) {
            if (values[key] !== undefined) {
                this.setField(key, this, values[key]);
            }
        }
        this.iconUrl = values.iconUrl;
    }
}
