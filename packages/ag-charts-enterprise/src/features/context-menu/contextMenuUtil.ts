import { _ModuleSupport } from 'ag-charts-community';
import { ChartAxisDirection } from 'ag-charts-core';
import type { AgContextMenuGetItemsParamsAlways, AgContextMenuGetItemsParamsAxis } from 'ag-charts-types';

// Dynamically extract properties of `AgContextMenuGetItemsParamsAxis` that are not present in the base
// `AgContextMenuGetItemsParamsAlways` (except for `context` because we need to broadcast the user option
// `axes[key].context` if defined).
export type PublicAxisContext = Omit<
    AgContextMenuGetItemsParamsAxis,
    Exclude<keyof AgContextMenuGetItemsParamsAlways, 'context'>
>;

export function toPublicAxisContext(event: _ModuleSupport.ContextMenuEvent<'axis'>): PublicAxisContext {
    const axisCtx = event.context;
    const userCtx = event.context.context;

    const { axisId, direction } = axisCtx;
    const { domain } = axisCtx.scale;
    const boundSeries = axisCtx.getFormatterBoundSeries();
    const value = resolveAxisValue(event);
    return { axisId, direction, context: userCtx, boundSeries, domain, value };
}

function resolveAxisValue(event: _ModuleSupport.ContextMenuEvent<'axis'>): PublicAxisContext['value'] {
    const axisCtx = event.context;
    const local = axisCtx.fromCanvasPoint({ x: event.x, y: event.y });
    const position = axisCtx.direction === ChartAxisDirection.Y ? local.y : local.x;
    return axisCtx.scaleInvert(position) ?? Number.NaN;
}
