import { _ModuleSupport } from 'ag-charts-community';
import type { AxisModuleDefinition } from 'ag-charts-core';
import type {
    AgAngleCategoryAxisOptions,
    AgAngleNumberAxisOptions,
    AgOrdinalTimeAxisOptions,
    AgRadiusCategoryAxisOptions,
    AgRadiusNumberAxisOptions,
} from 'ag-charts-types';

import { AngleCategoryAxis } from './angle-category/angleCategoryAxis';
import { AngleNumberAxis } from './angle-number/angleNumberAxis';
import { OrdinalTimeAxis } from './ordinal/ordinalTimeAxis';
import { RadiusCategoryAxis } from './radius-category/radiusCategoryAxis';
import { RadiusNumberAxis } from './radius-number/radiusNumberAxis';

const {
    ordinalTimeAxisOptionsDefs,
    angleNumberAxisOptionsDefs,
    angleCategoryAxisOptionsDefs,
    radiusNumberAxisOptionsDefs,
    radiusCategoryAxisOptionsDefs,
} = _ModuleSupport;

export const OrdinalTimeAxisModule: AxisModuleDefinition<AgOrdinalTimeAxisOptions> = {
    type: 'axis',
    name: 'ordinal-time',
    chartType: 'cartesian',
    enterprise: true,

    options: ordinalTimeAxisOptionsDefs,

    create: (ctx: _ModuleSupport.ModuleContext) => new OrdinalTimeAxis(ctx),
};

export const AngleNumberAxisModule: AxisModuleDefinition<AgAngleNumberAxisOptions> = {
    type: 'axis',
    name: 'angle-number',
    chartType: 'polar',
    enterprise: true,

    options: angleNumberAxisOptionsDefs,

    create: (ctx: _ModuleSupport.ModuleContext) => new AngleNumberAxis(ctx),
};

export const AngleCategoryAxisModule: AxisModuleDefinition<AgAngleCategoryAxisOptions> = {
    type: 'axis',
    name: 'angle-category',
    chartType: 'polar',
    enterprise: true,

    options: angleCategoryAxisOptionsDefs,

    create: (ctx: _ModuleSupport.ModuleContext) => new AngleCategoryAxis(ctx),
};

export const RadiusNumberAxisModule: AxisModuleDefinition<AgRadiusNumberAxisOptions> = {
    type: 'axis',
    name: 'radius-number',
    chartType: 'polar',
    enterprise: true,

    options: radiusNumberAxisOptionsDefs,

    create: (ctx: _ModuleSupport.ModuleContext) => new RadiusNumberAxis(ctx),
};

export const RadiusCategoryAxisModule: AxisModuleDefinition<AgRadiusCategoryAxisOptions> = {
    type: 'axis',
    name: 'radius-category',
    chartType: 'polar',
    enterprise: true,

    options: radiusCategoryAxisOptionsDefs,

    create: (ctx: _ModuleSupport.ModuleContext) => new RadiusCategoryAxis(ctx),
};
