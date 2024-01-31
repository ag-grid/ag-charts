import type { _ModuleSupport } from 'ag-charts-community';
import { _Theme } from 'ag-charts-community';

import { ContextMenu } from './contextMenu';

export { ContextMenu } from './contextMenu';
export type { ContextMenuActionParams } from './contextMenu';

export const ContextMenuModule: _ModuleSupport.Module = {
    type: 'root',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy'],
    optionsKey: 'contextMenu',
    instanceConstructor: ContextMenu,
    themeTemplate: {
        contextMenu: {
            enabled: true,
            darkMode: _Theme.IS_DARK_MODE,
        },
    },
};
