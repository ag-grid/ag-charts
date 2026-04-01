import { type AgOrganisationSeriesOptions, VERSION } from 'ag-charts-community';
import {
    type OptionsDefs,
    type SeriesModuleDefinition,
    commonSeriesOptionsDefs,
    constant,
    required,
} from 'ag-charts-core';

import { OrganisationSeries } from './organisationSeries';

const organisationSeriesOptionsDef: OptionsDefs<AgOrganisationSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    type: required(constant('organisation')),
};

const organisationSeriesTheme = {};

export const OrganisationSeriesModule: SeriesModuleDefinition<AgOrganisationSeriesOptions> = {
    type: 'series',
    name: 'organisation',
    chartType: 'standalone',
    enterprise: true,
    solo: true,
    version: VERSION,
    options: organisationSeriesOptionsDef,
    themeTemplate: organisationSeriesTheme,
    create: (ctx) => new OrganisationSeries(ctx),
};
