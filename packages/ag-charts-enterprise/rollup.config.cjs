const base = require('../../rollup.base.cjs');

module.exports = (config) => {
    return base('agCharts', config, { umdOutput: 'none' });
};
