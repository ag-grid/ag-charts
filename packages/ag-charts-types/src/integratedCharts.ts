/* eslint-disable sonarjs/class-name */
import type { AgChartThemePalette } from './chart/themeOptions';
import type { AgChartInstance, AgChartInstanceOptions, AgSparklineOptions } from './chartBuilderOptions';

export interface _ITheme {
    getChartTheme(value: unknown): { palette: AgChartThemePalette };
}

export interface IntegratedModule {
    VERSION: string;
    _Theme: _ITheme;
    create(
        options: AgChartInstanceOptions<unknown, unknown>
    ): AgChartInstance<AgChartInstanceOptions<unknown, unknown>>;
    createSparkline(
        options: AgSparklineOptions<unknown, unknown>
    ): AgChartInstance<AgSparklineOptions<unknown, unknown>>;
    setup(): void;
    setGridContext?(gridContext: boolean): void;
    setLicenseKey?(licenseKey: string): void;
    isEnterprise: boolean;
}
