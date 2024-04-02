import deepClone from 'deepclone';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import 'ag-charts-enterprise';
import { AgChartsReact } from 'ag-charts-react';

import { getData, random } from './data';

// Series type data options
let start = [120, 150, 130, 140, 80];
let variance = 20;
let offset = 0;
let length = 8;
let seed = 1234;
const barOptions = {
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'one',
            yName: 'One',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'two',
            yName: 'Two',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'three',
            yName: 'Three',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'four',
            yName: 'Four',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'five',
            yName: 'Five',
            stacked: true,
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'category',
            position: 'bottom',
            label: {
                autoRotate: false,
            },
        },
    ],
};
const lineOptions = {
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'one',
            yName: 'One',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'two',
            yName: 'Two',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'three',
            yName: 'Three',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'four',
            yName: 'Four',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'five',
            yName: 'Five',
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
            nice: false,
            label: {
                autoRotate: false,
            },
        },
    ],
};
const areaOptions = {
    series: [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'one',
            yName: 'One',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'two',
            yName: 'Two',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'three',
            yName: 'Three',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'four',
            yName: 'Four',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'five',
            yName: 'Five',
            stacked: true,
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
            nice: false,
            label: {
                autoRotate: false,
            },
        },
    ],
};
const donutOptions = {
    series: [
        {
            type: 'pie',
            title: {
                text: 'One',
            },
            calloutLabelKey: 'year',
            legendItemKey: 'year',
            angleKey: 'one',
            outerRadiusRatio: 0.6,
        },
        {
            type: 'donut',
            title: {
                text: 'Two',
            },
            calloutLabelKey: 'year',
            legendItemKey: 'year',
            angleKey: 'two',
            innerRadiusRatio: 0.7,
            showInLegend: false,
        },
    ],
    axes: [],
};

function getGeneratedData() {
    return getData(start, variance, offset, length, seed);
}

const ChartExample = () => {
    const chartRef = useRef(null);
    const [options, setOptions] = useState({
        animation: {
            enabled: true,
        },
        data: getGeneratedData(),
        ...barOptions,
    });
    const [tickingUpdates, setTickingUpdates] = useState(false);

    const changeSeriesBar = () => {
        const clone = deepClone(options);

        variance = 20;
        offset = 0;
        length = 8;
        seed = 1234;
        clone.series = barOptions.series;
        clone.axes = barOptions.axes;
        clone.data = getGeneratedData();

        setOptions(clone);
    };

    const changeSeriesLine = () => {
        const clone = deepClone(options);

        variance = 4;
        offset = 0;
        length = 30;
        seed = 1234;
        clone.series = lineOptions.series;
        clone.axes = lineOptions.axes;
        clone.data = getGeneratedData();

        setOptions(clone);
    };

    const changeSeriesArea = () => {
        const clone = deepClone(options);

        variance = 20;
        offset = 0;
        length = 30;
        seed = 1234;
        clone.series = areaOptions.series;
        clone.axes = areaOptions.axes;
        clone.data = getGeneratedData();

        setOptions(clone);
    };

    const changeSeriesDonut = () => {
        const clone = deepClone(options);

        variance = 30;
        offset = 0;
        length = 6;
        seed = 1234;
        clone.series = donutOptions.series;
        clone.axes = donutOptions.axes;
        clone.data = getGeneratedData();

        setOptions(clone);
    };

    const toggleTickingUpdates = () => {
        const nextTickingUpdates = !tickingUpdates;
        setTickingUpdates(nextTickingUpdates);

        if (nextTickingUpdates) {
            offset++;
            setOptions((currentOptions) => {
                const clone = deepClone(currentOptions);
                clone.data = getGeneratedData();
                return clone;
            });
        }
    };

    const add = () => {
        const clone = deepClone(options);

        offset++;
        length++;
        clone.data = getGeneratedData();

        setOptions(clone);
    };

    const remove = () => {
        const clone = deepClone(options);

        length = Math.max(0, length - 1);
        clone.data = getGeneratedData();

        setOptions(clone);
    };

    const update = () => {
        const clone = deepClone(options);

        seed = Math.floor(random() * 1000);
        clone.data = getGeneratedData();

        setOptions(clone);
    };

    const addRemoveUpdate = () => {
        const clone = deepClone(options);

        offset++;
        seed = Math.floor(random() * 1000);
        clone.data = getGeneratedData();

        setOptions(clone);
    };

    useEffect(() => {
        if (!tickingUpdates) return;

        const interval = setInterval(() => {
            offset++;
            setOptions((currentOptions) => {
                const clone = deepClone(currentOptions);
                clone.data = getGeneratedData();
                return clone;
            });
        }, 2000);

        return () => {
            clearInterval(interval);
        };
    }, [tickingUpdates]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
                style={{
                    flex: 'none',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.5em',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: '0.5em',
                    }}
                >
                    <button onClick={changeSeriesBar}>Bar</button>
                    <button onClick={changeSeriesLine}>Line</button>
                    <button onClick={changeSeriesArea}>Area</button>
                    <button onClick={changeSeriesDonut}>Pie &amp; Donut</button>
                </div>
            </div>
            <div
                style={{
                    flex: 'none',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.5em',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: '0.5em',
                    }}
                >
                    <button className="animation-data-updates__action" onClick={add} disabled={tickingUpdates}>
                        Add
                    </button>
                    <button className="animation-data-updates__action" onClick={remove} disabled={tickingUpdates}>
                        Remove
                    </button>
                    <button className="animation-data-updates__action" onClick={update} disabled={tickingUpdates}>
                        Update
                    </button>
                </div>
                <button className="animation-data-updates__action" onClick={addRemoveUpdate} disabled={tickingUpdates}>
                    Add &amp; Remove &amp; Update
                </button>
                <button className="animation-data-updates__toggle-ticking" onClick={toggleTickingUpdates}>
                    {tickingUpdates ? 'Stop ticking updates' : 'Start ticking updates'}
                </button>
            </div>
            <AgChartsReact ref={chartRef} options={options} />
        </div>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<ChartExample />);
