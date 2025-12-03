import { type AgContextMenuOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import { type PluginModuleDefinition, boolean, callbackOf, undocumented } from 'ag-charts-core';

import { ContextMenu } from './contextMenu';

export const ContextMenuModule: PluginModuleDefinition<AgContextMenuOptions> = {
    type: 'plugin',
    name: 'contextMenu',
    enterprise: true,
    version: VERSION,

    options: {
        enabled: boolean,
        items: _ModuleSupport.contextMenuItemsArray,
        getItems: callbackOf(_ModuleSupport.contextMenuItemsArray, 'a menu items array'),
    },
    themeTemplate: {
        enabled: true,
        darkTheme: _ModuleSupport.ThemeSymbols.IS_DARK_THEME,
    },

    create: (ctx) => new ContextMenu(ctx),
};

// @ts-expect-error undocumented option
ContextMenuModule.options.darkTheme = undocumented(boolean);
