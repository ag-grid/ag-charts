import { type AgContextMenuOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    IS_DARK_THEME,
    type PluginModuleDefinition,
    boolean,
    callbackOf,
    contextMenuItemsArray,
    undocumented,
} from 'ag-charts-core';

import { AxisDOMProxyModule } from '../axis-dom-proxy/axisDomProxyModule';
import { ContextMenu, type ContextMenuCtx } from './contextMenu';

export const ContextMenuModule: PluginModuleDefinition<AgContextMenuOptions, _ModuleSupport.ChartRegistry> = {
    type: 'plugin',
    name: 'contextMenu',
    enterprise: true,
    version: VERSION,
    dependencies: [AxisDOMProxyModule],

    options: {
        enabled: boolean,
        items: contextMenuItemsArray,
        getItems: callbackOf(contextMenuItemsArray, 'a menu items array'),
    },
    themeTemplate: {
        enabled: true,
        darkTheme: IS_DARK_THEME,
    },

    // `register()` runs first and guarantees `contextMenuRegistry` is present, so we
    // narrow the ctx type to ContextMenuCtx at the boundary and avoid `!` assertions.
    create: (ctx) => new ContextMenu(ctx as ContextMenuCtx),
    register: (ctx) => {
        if (ctx.has('contextMenuRegistry')) return;
        ctx.service('contextMenuRegistry', (c) => new _ModuleSupport.ContextMenuRegistry(c));
    },
};

// @ts-expect-error undocumented option
ContextMenuModule.options.darkTheme = undocumented(boolean);
