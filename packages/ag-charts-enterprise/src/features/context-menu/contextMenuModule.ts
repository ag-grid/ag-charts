import { type AgContextMenuOptions, type ChartRegistry, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    IS_DARK_THEME,
    type PluginModuleDefinition,
    boolean,
    callbackOf,
    contextMenuItemsArray,
    undocumented,
} from 'ag-charts-core';

import { ContextMenu } from './contextMenu';

export const ContextMenuModule: PluginModuleDefinition<AgContextMenuOptions, ChartRegistry> = {
    type: 'plugin',
    name: 'contextMenu',
    enterprise: true,
    version: VERSION,

    options: {
        enabled: boolean,
        items: contextMenuItemsArray,
        getItems: callbackOf(contextMenuItemsArray, 'a menu items array'),
    },
    themeTemplate: {
        enabled: true,
        darkTheme: IS_DARK_THEME,
    },

    create: (ctx) => new ContextMenu(ctx),
    register: (ctx) => {
        if (ctx.has('contextMenuRegistry')) return;
        ctx.service('contextMenuRegistry', (c) => new _ModuleSupport.ContextMenuRegistry(c));
    },
};

// @ts-expect-error undocumented option
ContextMenuModule.options.darkTheme = undocumented(boolean);
