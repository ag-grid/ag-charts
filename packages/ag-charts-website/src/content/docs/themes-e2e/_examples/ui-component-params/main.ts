// @ag-skip-fws
import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    rangeButtons: false,
    navigator: false,
    toolbar: true,
    volume: false,
    zoom: false,
    theme: {
        params: {
            cardShadow: '0 0 0 4px #ff00ff',
            popupShadow: '0 0 0 4px #00ffff',
            colorPickerColorBorderRadius: 8,
            colorPickerThumbBorderWidth: 5,
            colorPickerThumbSize: 24,
            colorPickerTrackBorderRadius: 3,
            colorPickerTrackSize: 20,
            dragHandleColor: '#ff0000',
            inputPlaceholderTextColor: '#00ff00',
        },
    },
};

AgCharts.createFinancialChart(options);
