import type {
    AgContextMenuItem,
    AgContextMenuItemLiteral,
    AgContextMenuItemShowOn,
    AgContextMenuItemType,
    _ModuleSupport,
} from 'ag-charts-community';
import { isKeyOf } from 'ag-charts-core';

type Options = Partial<_ModuleSupport.ContextMenuItemContractNonRecursive>;
type AgContextMenuItem_NoLists = Exclude<AgContextMenuItem, keyof _ModuleSupport.ContextMenuBuiltins['lists']>;

function showsFor(showOn: AgContextMenuItemShowOn, showing: AgContextMenuItemShowOn): boolean {
    if (showOn === 'always') return true;
    if (showOn === 'series-area') return showing === 'series-area' || showing === 'series-node';
    return showOn === showing;
}

function appendItem(
    showing: AgContextMenuItemShowOn,
    item: Options,
    result: ContextMenuItem[]
): ContextMenuItem | undefined {
    let mustShow: boolean = true;
    if (item.type === 'separator') {
        const last: ContextMenuItem | undefined = result.at(-1);
        mustShow = last !== undefined && last.type !== 'separator';
    }

    mustShow &&= showsFor(item.showOn ?? 'always', showing);
    if (mustShow) {
        const menuItem = new ContextMenuItem(item);
        result.push(menuItem);
        return menuItem;
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

function expandBuiltin(
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

export function expandBuiltinLists(
    showing: AgContextMenuItemShowOn,
    items: readonly Readonly<AgContextMenuItem>[],
    registry: _ModuleSupport.ContextMenuRegistry
): AgContextMenuItem_NoLists[] {
    const unfiltered: AgContextMenuItem_NoLists[] = [];
    const { builtins } = registry;
    for (const it of items) {
        if (typeof it === 'string' && isKeyOf(it, builtins.lists)) {
            for (const listItem of builtins.lists[it]) {
                unfiltered.push(listItem);
            }
        } else {
            unfiltered.push(it);
        }
    }

    return unfiltered.filter((it) => {
        if (typeof it === 'string') {
            const showOn = registry.builtins.items[it].showOn ?? 'always';
            return registry.isVisible(it) && showsFor(showOn, showing);
        } else {
            return showsFor(it.showOn ?? 'always', showing);
        }
    });
}

export function expandItems(
    showing: AgContextMenuItemShowOn,
    registry: _ModuleSupport.ContextMenuRegistry,
    items: readonly Readonly<AgContextMenuItem>[],
    result: ContextMenuItem[]
) {
    for (const item of items) {
        if (typeof item === 'string') {
            expandBuiltin(showing, registry, item, result);
        } else {
            const menuItem = appendItem(showing, item, result);
            if (item.items && menuItem && item.items.length > 0) {
                expandItems(showing, registry, item.items, menuItem.items);
            }
        }
    }
    // remove trailing 'separator' menu item
    if (result.at(-1)?.type === 'separator') {
        result.pop();
    }
}

export class ContextMenuItem implements _ModuleSupport.ContextMenuItemContract {
    type: AgContextMenuItemType = 'action';
    showOn: AgContextMenuItemShowOn = 'always';
    label: string = '';
    iconUrl: string | undefined = undefined;
    enabled: boolean = true;
    items: ContextMenuItem[] = [];
    action: _ModuleSupport.ContextMenuItemContract['action'] = undefined;

    constructor(options?: Options) {
        if (options) this.setOptions(options);
        this.items = [];
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
    }
}
