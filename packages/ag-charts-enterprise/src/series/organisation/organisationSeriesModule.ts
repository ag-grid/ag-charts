import { type AgOrganisationSeriesOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    type SeriesModuleDefinition,
    commonSeriesOptionsDefs,
    constant,
    required,
    string,
} from 'ag-charts-core';

import { OrganisationSeries } from './organisationSeries';

const organisationSeriesOptionsDef: OptionsDefs<AgOrganisationSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ..._ModuleSupport.organisationSeriesThemeableOptionsDef,
    type: required(constant('organization')),
    idKey: string,
    parentIdKey: string,
};

const organisationSeriesTheme = {};

export const OrganisationSeriesModule: SeriesModuleDefinition<AgOrganisationSeriesOptions> = {
    type: 'series',
    name: 'organization',
    chartType: 'standalone',
    enterprise: true,
    solo: true,
    version: VERSION,
    options: organisationSeriesOptionsDef,
    themeTemplate: organisationSeriesTheme,
    create: (ctx) => new OrganisationSeries(ctx),
};
