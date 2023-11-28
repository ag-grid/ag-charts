import React, { useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { AgChartsReact } from 'ag-charts-react';

const ChartExample = () => {
    const chartRef = useRef(null);
    const [options, setOptions] = useState({
        theme: 'ag-default-dark',
        title: {
            text: 'Chart Theme Example',
        },
        data: getData(),
        series: [
            {
                type: 'pie',
                angleKey: 'value',
                calloutLabelKey: 'label',
            },
        ],
    });

    const setThemeDefault = useCallback(() => {
        const clone = { ...options };

        clone.theme = options.theme.includes('-dark') ? 'ag-default-dark' : 'ag-default';

        setOptions(clone);
    }, [options]);

    const setThemeSheets = useCallback(() => {
        const clone = { ...options };

        clone.theme = options.theme.includes('-dark') ? 'ag-sheets-dark' : 'ag-sheets';

        setOptions(clone);
    }, [options]);

    const setThemePolychroma = useCallback(() => {
        const clone = { ...options };

        clone.theme = options.theme.includes('-dark') ? 'ag-polychroma-dark' : 'ag-polychroma';

        setOptions(clone);
    }, [options]);

    const setThemeVivid = useCallback(() => {
        const clone = { ...options };

        clone.theme = options.theme.includes('-dark') ? 'ag-vivid-dark' : 'ag-vivid';

        setOptions(clone);
    }, [options]);

    const setThemeMaterial = useCallback(() => {
        const clone = { ...options };

        clone.theme = options.theme.includes('-dark') ? 'ag-material-dark' : 'ag-material';

        setOptions(clone);
    }, [options]);

    const toggleDarkTheme = useCallback(() => {
        const clone = { ...options };

        clone.theme = options.theme.includes('-dark') ? clone.theme.replace('-dark', '') : clone.theme + '-dark';

        setOptions(clone);
    }, [options]);

    return (
        <div className="wrapper">
            <div className="toolPanel">
                <button onClick={setThemeDefault}>Default Theme</button>
                <button onClick={setThemeSheets}>Sheets Theme</button>
                <button onClick={setThemePolychroma}>Polychroma Theme</button>
                <button onClick={setThemeVivid}>Vivid Theme</button>
                <button onClick={setThemeMaterial}>Material Theme</button>
            </div>
            <div className="toolPanel">
                <button onClick={toggleDarkTheme}>Toggle Dark Theme</button>
            </div>
            <AgChartsReact ref={chartRef} options={options} />
        </div>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<ChartExample />);
