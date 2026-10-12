import { type AgContextMenuOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import { type PluginModuleDefinition, boolean, callbackOf, contextMenuItemsArray } from 'ag-charts-core';

import { AxisInteractionModule } from '../axis-interaction/axisInteractionModule';
import { ContextMenu, type ContextMenuCtx } from './contextMenu';

export const ContextMenuModule: PluginModuleDefinition<AgContextMenuOptions, _ModuleSupport.ChartRegistry> = {
    type: 'plugin',
    name: 'contextMenu',
    enterprise: true,
    version: VERSION,
    dependencies: [AxisInteractionModule],

    options: {
        enabled: boolean,
        allowBrowserMenuWithModifierKey: boolean,
        items: contextMenuItemsArray,
        getItems: callbackOf(contextMenuItemsArray, 'a menu items array'),
    },
    themeTemplate: {
        enabled: true,
        allowBrowserMenuWithModifierKey: false,
    },

    // `register()` runs first and guarantees `contextMenuRegistry` is present, so we
    // narrow the ctx type to ContextMenuCtx at the boundary and avoid `!` assertions.
    create: (ctx) => new ContextMenu(ctx as ContextMenuCtx),
    register: (ctx) => {
        if (ctx.has('contextMenuRegistry')) return;
        ctx.service('contextMenuRegistry', (c) => new _ModuleSupport.ContextMenuRegistry(c));
    },
};
