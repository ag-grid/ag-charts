import { _ModuleSupport } from 'ag-charts-community';
import type { ExtensibleTheme } from 'ag-charts-types';

import { deepClone, jsonWalk} from 'ag-charts-core';
export const MAP_THEME_DEFAULTS: ExtensibleTheme<'map-shape' | 'map-line' | 'map-marker'> = {
    zoom: {
        axes: 'xy',
        anchorPointX: 'pointer',
        anchorPointY: 'pointer',
        buttons: {
            // @ts-expect-error undocumented options
            anchorPointX: 'middle',
            anchorPointY: 'middle',
        },
    },
    legend: {
        enabled: false,
    },
    gradientLegend: {
        enabled: false,
        ..._ModuleSupport.LEGEND_CONTAINER_THEME,
    },
};

export function applyMapPalette<T extends object>(object: T): T {
    const clone = deepClone(object);

    jsonWalk(clone, (value) => {
        if (typeof value === 'object' && '$palette' in value) {
            (value as any)['$mapPalette'] = value['$palette'];
            delete value['$palette'];
        }
    });

    return clone;
}
