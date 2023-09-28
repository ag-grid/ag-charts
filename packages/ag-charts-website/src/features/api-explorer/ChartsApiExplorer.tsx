import classnames from 'classnames';
import { useState } from 'react';
import { Chart } from './Chart';
import styles from './ChartsApiExplorer.module.scss';
import { ChartTypeSelector } from './ChartTypeSelector';
import { CodeView } from './CodeView';
import { Launcher } from './Launcher';
import { Options } from './Options';
import { isXAxisNumeric } from './utils';

const createOptionsJson = (chartType, options) => {
    const optionsHasAxes = Array.isArray(options.axes) && options.axes.length > 0;

    const json = {
        ...options,
        axes: optionsHasAxes
            ? [
                  {
                      type: isXAxisNumeric(chartType) ? 'number' : 'category',
                      position: 'bottom',
                      ...(options.axes[0] || {}),
                  },
                  {
                      type: 'number',
                      position: 'left',
                      ...(options.axes[1] || {}),
                  },
              ]
            : undefined,
    };

    for (const axis of json.axes ?? []) {
        const { gridStyle, crossLines } = axis;

        if (gridStyle && !Array.isArray(gridStyle)) {
            // special handling for gridStyle which requires an array
            axis.gridStyle = [gridStyle];
        }

        if (crossLines && !Array.isArray(crossLines)) {
            // special handling for crossLines which requires an array
            axis.crossLines = [crossLines];
        }
    }

    switch (chartType) {
        case 'column': // TODO: `column` doesn't exist anymore
            json.series = ['revenue', 'profit'].map((yKey) => ({
                type: 'bar',
                xKey: 'month',
                yKey,
                stacked: true,
                ...options.series,
            }));
            break;
        case 'bar':
            json.series = ['revenue', 'profit'].map((yKey) => ({
                type: 'bar',
                xKey: 'month',
                yKey,
                stacked: true,
                ...options.series,
            }));
            break;
        case 'line':
            json.series = [
                {
                    type: 'line',
                    xKey: 'month',
                    yKey: 'revenue',
                    ...options.series,
                },
                {
                    type: 'line',
                    xKey: 'month',
                    yKey: 'profit',
                },
            ];
            break;
        case 'area':
            json.series = ['revenue', 'profit'].map((yKey) => ({
                type: 'area',
                xKey: 'month',
                yKey,
                stacked: true,
                ...options.series,
            }));
            break;
        case 'scatter':
            json.series = [
                {
                    type: 'scatter',
                    xKey: 'revenue',
                    yKey: 'profit',
                    ...options.series,
                },
            ];
            break;
        case 'pie':
            json.series = [
                {
                    type: 'pie',
                    angleKey: 'revenue',
                    calloutLabelKey: 'month',
                    ...options.series,
                },
            ];
            const firstSeries = json.series?.[0];
            if (firstSeries?.innerLabels) {
                // special handling for inner labels which requires an array
                firstSeries.innerLabels = [firstSeries.innerLabels];
            }
            break;
        case 'histogram':
            json.series = [
                {
                    type: 'histogram',
                    xKey: 'revenue',
                    yKey: 'profit',
                    ...options.series,
                },
            ];
            break;
        default:
            throw new Error(`Unrecognised chart type: ${chartType}`);
    }

    return json;
};

/**
 * The Standalone Charts API Explorer is an interactive tool for exploring the charts API. The user can change different
 * settings and see how they affect the appearance of the chart, and it will generate the code they would need to use in
 * the framework of their choice.
 */
export const ChartsApiExplorer = ({ framework, interfaceLookup, codeLookup }) => {
    const [chartType, setChartType] = useState('column');
    const [options, setOptions] = useState({});
    const [defaults, setDefaults] = useState({});
    const [fullScreen, setFullScreen] = useState(false);
    const [fullScreenGraph, setFullScreenGraph] = useState(false);

    const getKeys = (expression) => expression.split('.');

    const getDefaultValue = (expression) => {
        const keys = getKeys(expression);
        let value = { ...defaults };

        while (keys.length > 0 && value != null) {
            value = value[keys.shift()];
        }

        return value;
    };

    const updateOption = (expression, value, requiresWholeObject = false) => {
        const keys = getKeys(expression);
        const parentKeys = [...keys];
        parentKeys.pop();
        const defaultParent = { ...(getDefaultValue(parentKeys.join('.')) || defaults) };
        const newOptions = { ...options };
        let objectToUpdate = newOptions;
        const lastKeyIndex = keys.length - 1;

        for (let i = 0; i < lastKeyIndex; i++) {
            const key = keys[i];
            const parent = objectToUpdate;

            const isArray = !isNaN(keys[i + 1]);
            if (parent[key] == null) {
                objectToUpdate = requiresWholeObject && i === lastKeyIndex - 1 ? defaultParent : isArray ? [] : {};
            } else {
                objectToUpdate = isArray ? [...parent[key]] : { ...parent[key] };
            }

            parent[key] = objectToUpdate;
        }

        objectToUpdate[keys[lastKeyIndex]] = value;

        setOptions(newOptions);
    };

    const updateChartType = (type) => {
        if (chartType === type) {
            return;
        }

        setChartType(type);
        setDefaults({});
        setOptions({});
    };

    const optionsJson = createOptionsJson(chartType, options);

    return (
        <div
            className={classnames('tabs-outer', styles.container, {
                [styles.fullscreen]: fullScreen,
            })}
        >
            <header className={classnames('tabs-header', styles.header)}>
                <ChartTypeSelector type={chartType} onChange={updateChartType} />
                <Launcher
                    options={optionsJson}
                    {...{ framework, fullScreen, fullScreenGraph, setFullScreen, setFullScreenGraph }}
                />
            </header>
            <div
                className={classnames('tabs-content', styles.content)}
                role="tabpanel"
                aria-labelledby={`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} chart type`}
            >
                <div className={styles.optionsContainer}>
                    <div className={styles.options}>
                        <Options
                            chartType={chartType}
                            updateOption={updateOption}
                            interfaceLookup={interfaceLookup}
                            codeLookup={codeLookup}
                        />
                    </div>
                </div>
                <div className={styles.chartContainer}>
                    <div className={styles.chart}>
                        <Chart options={optionsJson} fullScreen={fullScreenGraph} setFullScreen={setFullScreenGraph} />
                    </div>
                    <div className={styles.codeContainer}>
                        <CodeView framework={framework} options={optionsJson} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChartsApiExplorer;
