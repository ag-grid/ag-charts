"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flushTimings = exports.logTimings = exports.recordTiming = void 0;
const tslib_1 = require("tslib");
/* eslint-disable no-console */
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const records = new Map();
function recordTiming(suitePath, name, measurement) {
    var _a;
    suitePath = suitePath.replace(process.cwd(), '');
    if (!records.has(suitePath)) {
        records.set(suitePath, new Map());
    }
    (_a = records.get(suitePath)) === null || _a === void 0 ? void 0 : _a.set(name, measurement);
    return measurement.memory ? getTotalMemoryUsage(measurement.memory) : undefined;
}
exports.recordTiming = recordTiming;
function logTimings() {
    const timings = collectTimings((measurement) => {
        var _a;
        return (Object.assign({ time: formatMillis(measurement.timeMs), memoryUsage: measurement.memory ? formatBytes(getTotalMemoryUsage(measurement.memory)) : null, heapUsed: measurement.memory ? formatBytes(measurement.memory.after.heapUsed) : null }, Object.fromEntries((((_a = measurement.memory) === null || _a === void 0 ? void 0 : _a.nativeAllocations) ? Object.entries(measurement.memory.nativeAllocations) : []).flatMap(([objectName, value]) => [
            [`${objectName}Count`, value.count],
            [`${objectName}Bytes`, formatBytes(value.bytes)],
        ]))));
    });
    for (const [suitePath, results] of timings) {
        console.log(suitePath);
        console.table(results);
    }
}
exports.logTimings = logTimings;
function flushTimings() {
    const timings = collectTimings((measurement) => {
        var _a;
        return (Object.assign({ timeMs: measurement.timeMs, memoryUsage: measurement.memory ? getTotalMemoryUsage(measurement.memory) : null, heapUsed: measurement.memory ? measurement.memory.after.heapUsed : null }, Object.fromEntries((((_a = measurement.memory) === null || _a === void 0 ? void 0 : _a.nativeAllocations) ? Object.entries(measurement.memory.nativeAllocations) : []).flatMap(([objectName, value]) => [
            [`${objectName}Count`, value.count],
            [`${objectName}Bytes`, value.bytes],
        ]))));
    });
    for (const [suitePath, results] of timings) {
        const filename = `./reports${suitePath.replace(/.ts$/, '.json')}`;
        fs.mkdirSync(path.dirname(filename), { recursive: true });
        fs.writeFileSync(filename, JSON.stringify(results));
        console.log(`Wrote timings to ${filename}`);
    }
}
exports.flushTimings = flushTimings;
function collectTimings(format) {
    return new Map(Array.from(records).map(([suitePath, suiteRecords]) => [
        suitePath,
        Object.fromEntries(Array.from(suiteRecords).map(([name, measurement]) => [name, format(measurement)])),
    ]));
}
function getTotalMemoryUsage(memoryStats) {
    const jsHeapSize = memoryStats.after.heapUsed;
    if (!memoryStats.nativeAllocations)
        return jsHeapSize;
    return Object.values(memoryStats.nativeAllocations).reduce((totalBytes, { bytes }) => totalBytes + bytes, jsHeapSize);
}
function formatMillis(ms) {
    return `${ms.toFixed(2)}ms`;
}
function formatBytes(bytes) {
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(2)}KB` : `${(kb / 1024).toFixed(2)}MB`;
}
process.on('beforeExit', () => {
    flushTimings();
});
//# sourceMappingURL=timing.js.map