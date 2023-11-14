const base = require('../../rollup.base.cjs');

module.exports = (config) => {
    return base('agCharts', {
        ...config,
        external(...args) {
            if (args[0].startsWith('ag-charts-community')) {
                return false;
            }
            return config.external(...args);
        }
    });
};
