import { deepClone, jsonWalk, undocumentedThemeOptions } from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

export const MAP_THEME_DEFAULTS: ExtensibleSeriesTheme<'map-shape' | 'map-line' | 'map-marker'> = {
    zoom: {
        axes: 'xy',
        anchorPointX: 'pointer',
        anchorPointY: 'pointer',
        buttons: {
            ...undocumentedThemeOptions({
                anchorPointX: 'middle',
                anchorPointY: 'middle',
            }),
        },
    },
    legend: {
        enabled: false,
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
