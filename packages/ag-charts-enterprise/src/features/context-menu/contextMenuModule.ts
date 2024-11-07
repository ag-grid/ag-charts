import { _ModuleSupport } from 'ag-charts-community';

import { ContextMenu } from './contextMenu';

export const ContextMenuModule: _ModuleSupport.Module = {
    type: 'root',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy', 'topology', 'flow-proportion', 'standalone', 'gauge'],
    optionsKey: 'contextMenu',
    moduleFactory: (ctx) => new ContextMenu(ctx),
    themeTemplate: {
        contextMenu: {
            enabled: true,
            darkTheme: _ModuleSupport.ThemeSymbols.IS_DARK_THEME,
        },
    },
};
