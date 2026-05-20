// only used by benchmark tests now
const nxPreset = require('@nx/jest/preset').default;

module.exports = { ...nxPreset, transform: {}, collectCoverage: false, coverageReporters: [] };
