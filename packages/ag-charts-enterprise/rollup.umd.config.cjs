const base = require('../../rollup.base.cjs');

module.exports = (config) => {
    return base('agChartsEnterprise', config, { umdOutput: 'only', filename: 'ag-charts-enterprise.js' });
};
