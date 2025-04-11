import type {
    AgContextMenuItemLiteral,
    AgContextMenuItemShowOn,
    AgContextMenuItemType,
    _ModuleSupport,
} from 'ag-charts-community';
import { isKeyOf } from 'ag-charts-core';

type Options = Partial<_ModuleSupport.ContextMenuItemContractNonRecursive>;

export function expandBuiltin(
    builtins: _ModuleSupport.ContextMenuRegistry['builtins'],
    keyword: AgContextMenuItemLiteral,
    result: ContextMenuItem[]
) {
    if (isKeyOf(keyword, builtins.lists)) {
        for (const options of builtins.lists[keyword]) {
            result.push(new ContextMenuItem(options));
        }
    } else {
        result.push(new ContextMenuItem(builtins.items[keyword]));
    }
}

export function removeUnusedItems(
    items: readonly ContextMenuItem[],
    showOn: AgContextMenuItemShowOn
): ContextMenuItem[] {
    const result: ContextMenuItem[] = [];
    let count = 0;
    for (const it of items) {
        const isSep: boolean = it.type === 'separator';
        if (it.showsFor(showOn) && (count > 0 || !isSep)) {
            count++;
            result.push(it);
        }
        if (isSep) count = 0;
    }
    if (result[result.length - 1].type === 'separator') {
        result.length = result.length - 1;
    }
    return result;
}

export class ContextMenuItem implements _ModuleSupport.ContextMenuItemContract {
    type: AgContextMenuItemType = 'action';
    showOn: AgContextMenuItemShowOn = 'always';
    label: string = '';
    iconUrl: string | undefined = undefined;
    enable: boolean = true;
    items: ContextMenuItem[] = [];
    action: _ModuleSupport.ContextMenuItemContract['action'] = undefined;

    constructor(options?: Options) {
        if (options) this.setOptions(options);
    }

    private setField<K extends keyof Options>(key: K, that: { [L in K]: Options[K] }, value: Options[K]): void {
        that[key] = value;
    }

    setOptions(options: Options) {
        let key: keyof typeof options & keyof ContextMenuItem;
        for (key in options) {
            if (options[key] !== undefined) {
                this.setField(key, this, options[key]);
            }
        }
        this.iconUrl = options.iconUrl;
    }

    showsFor(showOn: AgContextMenuItemShowOn): boolean {
        if (this.showOn === 'always') return true;
        if (this.showOn === 'series-area') return showOn === 'series-area' || showOn === 'series-node';
        return this.showOn === showOn;
    }
}
