import type { AgContextMenuItemShowOn, AgContextMenuItemType, _ModuleSupport } from 'ag-charts-community';

type Options = Partial<_ModuleSupport.ContextMenuItemContractNonRecursive>;

export class ContextMenuItem implements _ModuleSupport.ContextMenuItemContract {
    type: AgContextMenuItemType = 'action';
    showOn: AgContextMenuItemShowOn = 'always';
    label: string = '';
    iconUrl: string | undefined = undefined;
    enable: boolean = true;
    items: ContextMenuItem[] = [];
    action: _ModuleSupport.ContextMenuItemContract['action'] = undefined;

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
