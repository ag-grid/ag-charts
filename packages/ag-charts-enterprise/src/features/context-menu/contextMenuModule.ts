import type { _ModuleSupport } from 'ag-charts-community';

import type { ContextMenuActionParams } from './contextMenu';
import { ContextMenu } from './contextMenu';

export { ContextMenuActionParams } from './contextMenu';

export const ContextMenuModule: _ModuleSupport.Module = {
    type: 'root',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy'],
    optionsKey: 'contextMenu',
    instanceConstructor: ContextMenu,
    themeTemplate: {
        contextMenu: {
            enabled: true,
        },
    },
};

export function _registerDefaultAction(
    id: string,
    label: string,
    action: (params: ContextMenuActionParams) => void
): void {
    ContextMenu.registerDefaultAction({ id, label, action });
}

export function _registerNodeAction(
    id: string,
    label: string,
    action: (params: ContextMenuActionParams) => void
): void {
    ContextMenu.registerNodeAction({ id, label, action });
}

export function _disableAction(actionId: string) {
    ContextMenu.disableAction(actionId);
}

export function _enableAction(actionId: string) {
    ContextMenu.enableAction(actionId);
}
