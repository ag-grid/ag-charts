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

type ActiveRegions = ReadonlySet<AgContextMenuItemShowOn>;

function showsFor(showOn: AgContextMenuItemShowOn, active: ActiveRegions): boolean {
    if (showOn === 'always') return true;
    if (showOn === 'series-area') return active.has('series-area') || active.has('series-node');
    return active.has(showOn);
}

function appendItem(active: ActiveRegions, item: Options, result: ContextMenuItem[]): ContextMenuItem | undefined {
    let mustShow: boolean = true;
    if (item.type === 'separator') {
        const last: ContextMenuItem | undefined = result.at(-1);
        mustShow = last !== undefined && last.type !== 'separator';
    }

    mustShow &&= showsFor(item.showOn ?? 'always', active);
    if (mustShow) {
        const menuItem = new ContextMenuItem(item);
        result.push(menuItem);
        return menuItem;
    }
}

function appendBuiltinItem(
    active: ActiveRegions,
    registry: _ModuleSupport.ContextMenuRegistry,
    keyword: keyof _ModuleSupport.ContextMenuRegistry['builtins']['items'],
    result: ContextMenuItem[]
) {
    if (registry.isVisible(keyword)) {
        appendItem(active, registry.builtins.items[keyword], result);
    }
}

function expandBuiltin(
    active: ActiveRegions,
    registry: _ModuleSupport.ContextMenuRegistry,
    keyword: AgContextMenuItemLiteral,
    result: ContextMenuItem[]
) {
    const { builtins } = registry;
    if (isKeyOf(keyword, builtins.lists)) {
        for (const childKeyword of builtins.lists[keyword]) {
            appendBuiltinItem(active, registry, childKeyword, result);
        }
    } else {
        appendBuiltinItem(active, registry, keyword, result);
    }
}

export function expandBuiltinLists(
    active: ActiveRegions,
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
            return registry.isVisible(it) && showsFor(showOn, active);
        } else {
            return showsFor(it.showOn ?? 'always', active);
        }
    });
}

export function expandItems(
    active: ActiveRegions,
    registry: _ModuleSupport.ContextMenuRegistry,
    items: readonly Readonly<AgContextMenuItem>[],
    result: ContextMenuItem[]
) {
    for (const item of items) {
        if (typeof item === 'string') {
            expandBuiltin(active, registry, item, result);
        } else {
            const menuItem = appendItem(active, item, result);
            if (item.items && menuItem && item.items.length > 0) {
                expandItems(active, registry, item.items, menuItem.items);
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
