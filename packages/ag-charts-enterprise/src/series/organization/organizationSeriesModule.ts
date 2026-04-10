import { type AgOrganizationSeriesOptions, VERSION } from 'ag-charts-community';
import { type SeriesModuleDefinition } from 'ag-charts-core';

import { OrganizationSeries } from './organizationSeries';
import { organizationSeriesOptionsDef } from './organizationSeriesOptionsDef';
import { organizationSeriesTheme } from './organizationSeriesTheme';

export const OrganizationSeriesModule: SeriesModuleDefinition<AgOrganizationSeriesOptions> = {
    type: 'series',
    name: 'organization',
    chartType: 'standalone',
    enterprise: true,
    solo: true,
    version: VERSION,
    options: organizationSeriesOptionsDef,
    themeTemplate: organizationSeriesTheme,
    create: (ctx) => new OrganizationSeries(ctx),
};
