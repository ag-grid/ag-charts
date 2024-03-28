"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flushTimings = exports.logTimings = exports.recordTiming = void 0;
const tslib_1 = require("tslib");
/* eslint-disable no-console */
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const records = new Map();
function recordTiming(suitePath, name, timeMs) {
    suitePath = suitePath.replace(process.cwd(), '');
    if (!records.has(suitePath)) {
        records.set(suitePath, new Map());
    }
    records.get(suitePath).set(name, timeMs);
}
exports.recordTiming = recordTiming;
function logTimings() {
    for (const [suitePath, suiteRecords] of records) {
        const result = {};
        for (const [name, value] of suiteRecords) {
            result[name] = value;
        }
        console.log(suitePath);
        console.table(result);
    }
}
exports.logTimings = logTimings;
function flushTimings() {
    const mkdir = (dir) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    };
    for (const [suitePath, suiteRecords] of records) {
        const result = {};
        for (const [name, value] of suiteRecords) {
            result[name] = value;
        }
        const filename = `./reports${suitePath.replace(/.ts$/, '.json')}`;
        mkdir(path.dirname(filename));
        fs.writeFileSync(filename, JSON.stringify(result));
        console.log(`Wrote timings to ${filename}`);
    }
}
exports.flushTimings = flushTimings;
process.on('beforeExit', () => {
    flushTimings();
});
//# sourceMappingURL=timing.js.map