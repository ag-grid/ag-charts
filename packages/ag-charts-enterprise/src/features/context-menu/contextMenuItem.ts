import type {
    AgContextMenuItemLiteral,
    AgContextMenuItemShowOn,
    AgContextMenuItemType,
    _ModuleSupport,
} from 'ag-charts-community';
import { isKeyOf } from 'ag-charts-core';

type Options = Partial<_ModuleSupport.ContextMenuItemContractNonRecursive>;

function showsFor(showOn: AgContextMenuItemShowOn, showing: AgContextMenuItemShowOn): boolean {
    if (showOn === 'always') return true;
    if (showOn === 'series-area') return showing === 'series-area' || showing === 'series-node';
    return showOn === showing;
}

export function appendItem(showing: AgContextMenuItemShowOn, item: Options, result: ContextMenuItem[]) {
    let mustShow: boolean = true;
    if (item.type === 'separator') {
        const last: ContextMenuItem | undefined = result.at(result.length - 1);
        mustShow = last !== undefined && last.type !== 'separator';
    }

    mustShow &&= showsFor(item.showOn ?? 'always', showing);
    if (mustShow) {
        result.push(new ContextMenuItem(item));
    }
}

function appendBuiltinItem(
    showing: AgContextMenuItemShowOn,
    registry: _ModuleSupport.ContextMenuRegistry,
    keyword: keyof _ModuleSupport.ContextMenuRegistry['builtins']['items'],
    result: ContextMenuItem[]
) {
    if (registry.isVisible(keyword)) {
        appendItem(showing, registry.builtins.items[keyword], result);
    }
}

export function expandBuiltin(
    showing: AgContextMenuItemShowOn,
    registry: _ModuleSupport.ContextMenuRegistry,
    keyword: AgContextMenuItemLiteral,
    result: ContextMenuItem[]
) {
    const { builtins } = registry;
    if (isKeyOf(keyword, builtins.lists)) {
        for (const childKeyword of builtins.lists[keyword]) {
            appendBuiltinItem(showing, registry, childKeyword, result);
        }
    } else {
        appendBuiltinItem(showing, registry, keyword, result);
    }
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
}
