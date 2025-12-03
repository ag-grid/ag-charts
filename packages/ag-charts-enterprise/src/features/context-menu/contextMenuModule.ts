import { type AgContextMenuOptions, VERSION } from 'ag-charts-community';
import {
    IS_DARK_THEME,
    type PluginModuleDefinition,
    boolean,
    callbackOf,
    contextMenuItemsArray,
    undocumented,
} from 'ag-charts-core';

import { ContextMenu } from './contextMenu';

export const ContextMenuModule: PluginModuleDefinition<AgContextMenuOptions> = {
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
};

// @ts-expect-error undocumented option
ContextMenuModule.options.darkTheme = undocumented(boolean);
