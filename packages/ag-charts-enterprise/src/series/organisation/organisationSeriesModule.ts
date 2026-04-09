import { type AgOrganisationSeriesOptions, VERSION } from 'ag-charts-community';
import { type SeriesModuleDefinition } from 'ag-charts-core';

import { OrganisationSeries } from './organisationSeries';
import { organisationSeriesOptionsDef } from './organisationSeriesOptionsDef';
import { organisationSeriesTheme } from './organisationSeriesTheme';

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
