import type { _ModuleSupport } from 'ag-charts-community';
import { _Theme } from 'ag-charts-community';

import { ContextMenu } from './contextMenu';

export const ContextMenuModule: _ModuleSupport.Module = {
    type: 'root',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy', 'topology', 'sankey'],
    optionsKey: 'contextMenu',
    instanceConstructor: ContextMenu,
    themeTemplate: {
        contextMenu: {
            enabled: true,
            darkTheme: _Theme.IS_DARK_THEME,
        },
    },
};
