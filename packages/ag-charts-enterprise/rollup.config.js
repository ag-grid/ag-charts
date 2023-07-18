const base = require('../../rollup.base');

module.exports = (config) => {
    return base('agChartsEnterprise', config, {
        umd: {
            globals: {
                'ag-charts-community': 'agCharts',
            },
        },
    });
};
