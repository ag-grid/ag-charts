import type { ModuleContext } from '../module/moduleContext';
import type { JsonApplyParams } from '../util/json';
import { AxisTitle } from './axis/axisTitle';
import { Caption } from './caption';
import { DoughnutInnerCircle, DoughnutInnerLabel } from './series/polar/pieSeriesProperties';

export const JSON_APPLY_PLUGINS: JsonApplyParams = {
    constructors: {},
    constructedArrays: new WeakMap(),
};

export function assignJsonApplyConstructedArray(array: any[], ctor: new () => any) {
    JSON_APPLY_PLUGINS.constructedArrays?.set(array, ctor);
}

const JSON_APPLY_OPTIONS: JsonApplyParams = {
    constructors: {
        innerCircle: DoughnutInnerCircle,
        'axes[].title': AxisTitle,
        'series[].innerLabels[]': DoughnutInnerLabel,
    },
    allowedTypes: {
        'legend.pagination.marker.shape': ['primitive', 'function'],
        'series[].marker.shape': ['primitive', 'function'],
        'axis[].tick.count': ['primitive', 'class-instance'],
    },
};

export function getJsonApplyOptions(ctx: ModuleContext): JsonApplyParams {
    // Allow context to be injected and meet the type requirements
    class CaptionWithContext extends Caption {
        constructor() {
            super();
            this.registerInteraction(ctx);
        }
    }
    return {
        constructors: {
            ...JSON_APPLY_OPTIONS.constructors,
            title: CaptionWithContext,
            subtitle: CaptionWithContext,
            footnote: CaptionWithContext,
            ...JSON_APPLY_PLUGINS.constructors,
        },
        constructedArrays: JSON_APPLY_PLUGINS.constructedArrays,
        allowedTypes: {
            ...JSON_APPLY_OPTIONS.allowedTypes,
        },
    };
}
