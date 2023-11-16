const base = require('../../rollup.base.cjs');

module.exports = (config) => {
    return base('agChartsEnterprise', config, { onlyUmd: false });
};
