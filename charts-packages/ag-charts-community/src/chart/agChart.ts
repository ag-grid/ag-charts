import { Chart } from "./chart";
import { Series } from "./series/series";
import { ChartAxis } from "./chartAxis";
import { LegendMarker } from "./legend";
import { AgChartTheme } from "./themes/agChartTheme";
import { DarkTheme } from './themes/darkTheme';
import { MaterialLight } from "./themes/materialLight";
import { MaterialDark } from "./themes/materialDark";
import { PastelLight } from "./themes/pastelLight";
import { PastelDark } from "./themes/pastelDark";
import { SolarLight } from "./themes/solarLight";
import { SolarDark } from "./themes/solarDark";
import { VividLight } from "./themes/vividLight";
import { VividDark } from "./themes/vividDark";
import { find } from "../util/array";
import { getValue } from "../util/object";
import {
    AgCartesianChartOptions,
    AgChartOptions,
    AgPolarChartOptions,
    AgChartThemeOptions
} from "./agChartOptions";
import mappings from './agChartMappings';
import { CartesianChart } from "./cartesianChart";
import { PolarChart } from "./polarChart";

const defaultTheme = new AgChartTheme();
const themes: { [key in string]: AgChartTheme } = {
    default: defaultTheme,
    undefined: defaultTheme,
    null: defaultTheme,
    dark: new DarkTheme(),
    'material': new MaterialLight(),
    'material-dark': new MaterialDark(),
    'pastel': new PastelLight(),
    'pastel-dark': new PastelDark(),
    'solar': new SolarLight(),
    'solar-dark': new SolarDark(),
    'vivid': new VividLight(),
    'vivid-dark': new VividDark()
};

export function getChartTheme(value: string | AgChartTheme | AgChartThemeOptions): AgChartTheme {
    if (themes[value as string]) {
        return themes[value as string];
    }
    if (value instanceof AgChartTheme) {
        return value;
    }
    value = value as AgChartThemeOptions;
    if (value.defaults || value.palette) {
        const baseTheme: any = getChartTheme(value.baseTheme);
        return new baseTheme.constructor(value);
    }
    return themes.default;
}

type AgChartType<T> =
    T extends AgCartesianChartOptions ? CartesianChart :
    T extends AgPolarChartOptions ? PolarChart :
    never;

export abstract class AgChart {
    static create<T extends AgChartOptions>(options: T, container?: HTMLElement, data?: any[]): AgChartType<T> {
        options = Object.create(options); // avoid mutating user provided options
        if (container) {
            options.container = container;
        }
        if (data) {
            options.data = data;
        }
        // special handling when both `autoSize` and `width` / `height` are present in the options
        const autoSize = options && options.autoSize;
        const theme = getChartTheme(options.theme);
        const chart = create(options, undefined, undefined, theme);
        if (chart) {
            if (autoSize) {  // `autoSize` takes precedence over `width` / `height`
                chart.autoSize = true;
            }
            if (theme) {
                theme.updateChart(chart);
            }
        }
        return chart;
    }

    static update<T extends AgChartOptions>(chart: AgChartType<T>, options: T, container?: HTMLElement, data?: any[]) {
        if (!(chart && options)) {
            return;
        }
        options = Object.create(options);
        if (container) {
            options.container = container;
        }
        if (data) {
            options.data = data;
        }
        const autoSize = options && options.autoSize;
        const theme = getChartTheme(options.theme);
        update(chart, options, undefined, theme);
        if (autoSize) {
            chart.autoSize = true;
        }
        if (theme) {
            theme.updateChart(chart);
        }
    }

    static createComponent = create;
}

const pathToSeriesTypeMap: { [key in string]: string } = {
    'cartesian.series': 'line', // default series type for cartesian charts
    'line.series': 'line',
    'area.series': 'area',
    'bar.series': 'bar',
    'column.series': 'column',
    'scatter.series': 'scatter',
    'polar.series': 'pie', // default series type for polar charts
    'pie.series': 'pie'
};

function create(options: any, path?: string, component?: any, theme?: AgChartTheme) {
    // Deprecate `chart.legend.item.marker.type` in integrated chart options.
    options = Object.create(options);
    if (component instanceof LegendMarker) {
        if (options.type) {
            options.shape = options.type;
        }
    } else {
        options = provideDefaultType(options, path);
        if (path) {
            if (options.type) {
                path = path + '.' + options.type;
            }
        } else {
            path = options.type;
        }
    }

    const mapping = path && getValue(mappings, path);

    if (mapping) {
        options = provideDefaultOptions(path, options, mapping, theme);

        const meta = mapping.meta || {};
        const constructorParams = meta.constructorParams || [];
        const skipKeys = ['type', 'listeners'].concat(constructorParams);
        // TODO: Constructor params processing could be improved, but it's good enough for current params.
        const constructorParamValues = constructorParams
            .map((param: any) => options[param])
            .filter((value: any) => value !== undefined);

        component = component || new meta.constructor(...constructorParamValues);

        for (const key in options) {
            // Process every non-special key in the config object.
            if (skipKeys.indexOf(key) < 0) {
                const value = options[key];

                if (value && key in mapping && !(meta.setAsIs && meta.setAsIs.indexOf(key) >= 0)) {
                    if (Array.isArray(value)) {
                        const subComponents = value.map(config => create(config, path + '.' + key, undefined, theme)).filter(config => !!config);
                        component[key] = subComponents;
                    } else {
                        if (mapping[key] && component[key]) {
                            // The instance property already exists on the component (e.g. chart.legend).
                            // Simply configure the existing instance, without creating a new one.
                            create(value, path + '.' + key, component[key], theme);
                        } else {
                            const subComponent = create(value, value.type ? path : path + '.' + key, undefined, theme);
                            if (subComponent) {
                                component[key] = subComponent;
                            }
                        }
                    }
                } else { // if (key in meta.constructor.defaults) { // prevent users from creating custom properties
                    component[key] = value;
                }
            }
        }

        const listeners = options.listeners;
        if (component && component.addEventListener && listeners) {
            for (const key in listeners) {
                if (listeners.hasOwnProperty(key)) {
                    const listener = listeners[key];
                    if (typeof listener === 'function') {
                        component.addEventListener(key, listener);
                    }
                }
            }
        }

        return component;
    }
}

function update(component: any, options: any, path?: string, theme?: AgChartTheme) {
    if (!(options && typeof options === 'object')) {
        return;
    }

    // Deprecate `chart.legend.item.marker.type` in integrated chart options.
    if (component instanceof LegendMarker) {
        if (options.type) {
            options.shape = options.type;
        }
    } else {
        options = provideDefaultType(options, path);
        if (path) {
            if (options.type) {
                path = path + '.' + options.type;
            }
        } else {
            path = options.type;
        }
    }

    const chart: Chart | undefined = path in mappings ? (component as Chart) : undefined;
    const mapping = getValue(mappings, path);

    if (mapping) {
        options = provideDefaultOptions(path, options, mapping, theme);

        const meta = mapping.meta || {};
        const constructorParams = meta && meta.constructorParams || [];
        const skipKeys = ['type'].concat(constructorParams);

        for (const key in options) {
            if (skipKeys.indexOf(key) < 0) {
                const value = options[key];
                const keyPath = path + '.' + key;

                if (meta.setAsIs && meta.setAsIs.indexOf(key) >= 0) {
                    component[key] = value;
                } else {
                    const oldValue = component[key];

                    if (Array.isArray(oldValue) && Array.isArray(value)) {
                        if (chart) {
                            if (key === 'series') {
                                updateSeries(component, value, keyPath, theme);
                            } else if (key === 'axes') {
                                updateAxes(component, value, keyPath, theme);
                            }
                        } else {
                            component[key] = value;
                        }
                    } else if (typeof oldValue === 'object') {
                        if (value) {
                            update(oldValue, value, value.type ? path : keyPath, theme);
                        } else if (key in options) {
                            component[key] = value;
                        }
                    } else {
                        const subComponent = isObject(value) && create(value, value.type ? path : keyPath, undefined, theme);
                        if (subComponent) {
                            component[key] = subComponent;
                        } else {
                            if (chart && options.autoSize && (key === 'width' || key === 'height')) {
                                continue;
                            }
                            component[key] = value;
                        }
                    }
                }
            }
        }
    }

    if (chart) {
        chart.performLayout();
    }
}

function updateSeries(chart: Chart, configs: any[], keyPath: string, theme?: AgChartTheme) {
    const allSeries = chart.series;
    let prevSeries: Series | undefined;
    let i = 0;
    for (; i < configs.length; i++) {
        let config = configs[i];
        let series = allSeries[i];
        if (series) {
            config = provideDefaultType(config, keyPath);
            if (series.type === config.type) {
                update(series, config, keyPath, theme);
            } else {
                const newSeries = create(config, keyPath, undefined, theme);
                chart.removeSeries(series);
                chart.addSeriesAfter(newSeries, prevSeries);
                series = newSeries;
            }
        } else { // more new configs than existing series
            const newSeries = create(config, keyPath, undefined, theme);
            chart.addSeries(newSeries);
        }
        prevSeries = series;
    }
    // more existing series than new configs
    for (; i < allSeries.length; i++) {
        const series = allSeries[i];
        if (series) {
            chart.removeSeries(series);
        }
    }
}

function updateAxes(chart: Chart, configs: any[], keyPath: string, theme?: AgChartTheme) {
    const axes = chart.axes as ChartAxis[];
    const axesToAdd: ChartAxis[] = [];
    const axesToUpdate: ChartAxis[] = [];

    for (const config of configs) {
        const axisToUpdate = find(axes, axis => {
            return axis.type === config.type && axis.position === config.position;
        });
        if (axisToUpdate) {
            axesToUpdate.push(axisToUpdate);
            update(axisToUpdate, config, keyPath, theme);
        } else {
            const axisToAdd = create(config, keyPath, undefined, theme);
            if (axisToAdd) {
                axesToAdd.push(axisToAdd);
            }
        }
    }

    chart.axes = axesToUpdate.concat(axesToAdd);
}

function provideDefaultChartType(options: any): any {
    if (options.type) {
        return options;
    }
    // If chart type is not specified, try to infer it from the type of first series.
    const series = options.series && options.series[0];

    if (series && series.type) {
        outerLoop: for (const chartType in mappings) {
            for (const seriesType in mappings[chartType].series) {
                if (series.type === seriesType) {
                    options = Object.create(options);
                    options.type = chartType;
                    break outerLoop;
                }
            }
        }
    }
    if (!options.type) {
        options = Object.create(options);
        options.type = 'cartesian';
    }

    return options;
}

function provideDefaultType(options: any, path?: string): any {
    if (!path) { // if `path` is undefined, `options` is a top-level (chart) config
        options = provideDefaultChartType(options);
    }

    if (!options.type) {
        const seriesType = pathToSeriesTypeMap[path];
        if (seriesType) {
            options = Object.create(options);
            options.type = seriesType;
        }
    }

    return options;
}

function skipThemeKey(key: string): boolean {
    return ['axes', 'series'].indexOf(key) >= 0;
}
/**
 * If certain options were not provided by the user, use the defaults from the theme and the mapping.
 * All three objects are provided for the current path in the config tree, not necessarily top-level.
 */
function provideDefaultOptions(path: string, options: any, mapping: any, theme?: AgChartTheme): any {
    const isChartConfig = path.indexOf('.') < 0;
    const themeDefaults = theme && theme.getConfig(path);
    const defaults = mapping && mapping.meta && mapping.meta.defaults;

    if (defaults || themeDefaults) {
        options = Object.create(options);
    }
    // Fill in the gaps for properties not configured by the user using theme provided values.
    for (const key in themeDefaults) {
        // The default values for these special chart configs always come from the mappings, not theme.
        if (isChartConfig && skipThemeKey(key)) {
            continue;
        }
        if (!(key in options)) {
            options[key] = themeDefaults[key];
        }
    }
    // Fill in the gaps for properties not configured by the user, nor theme using chart mappings.
    for (const key in defaults) {
        if ((!themeDefaults || !(key in themeDefaults) || skipThemeKey(key)) && !(key in options)) {
            options[key] = defaults[key];
        }
    }

    return options;
}

function isObject(value: any): boolean {
    return typeof value === 'object' && !Array.isArray(value);
}
