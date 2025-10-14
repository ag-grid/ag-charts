import { type AgContextMenuOptions, _ModuleSupport } from 'ag-charts-community';
import { type PluginModuleDefinition, boolean, undocumented } from 'ag-charts-core';

import { ContextMenu } from './contextMenu';

export const ContextMenuModule: PluginModuleDefinition<AgContextMenuOptions> = {
    type: 'plugin',
    name: 'contextMenu',
    enterprise: true,

    options: {
        enabled: boolean,
        items: _ModuleSupport.contextMenuItemsArray,
    },
    themeTemplate: {
        enabled: true,
        darkTheme: _ModuleSupport.ThemeSymbols.IS_DARK_THEME,
    },

    create: (ctx) => new ContextMenu(ctx),
};

// @ts-expect-error undocumented option
ContextMenuModule.options.darkTheme = undocumented(boolean);
