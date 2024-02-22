"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExampleOptions = exports.loadExampleOptions = void 0;
const tslib_1 = require("tslib");
/* eslint-disable no-console */
const fs = tslib_1.__importStar(require("fs"));
const filters = [
    /AgCharts\.(create|update)/,
    /setInterval|setTimeout/,
    /container:/,
    /^Object\.defineProperty/,
    /^const (ag_charts_(community|enterprise)|data)_1 =/,
];
const cleanJs = (content) => content
    .split('\n')
    .filter((line) => !filters.some((f) => f.test(line)))
    .join('\n');
function loadExampleOptions(agCharts, name, evalReturn = 'options', exampleRootDir = `${process.cwd()}/dist/packages/ag-charts-community-examples/src/`, dataFile = `${exampleRootDir}charts-overview/examples/${name}/data.js`, exampleFile = `${exampleRootDir}charts-overview/examples/${name}/main.js`) {
    const { AgCharts, time, Marker } = agCharts;
    const evalContent = [cleanJs(fs.readFileSync(exampleFile, 'utf8')), `return ${evalReturn};`].join('\n');
    const evalExpr = fs.existsSync(dataFile) ? `const data_1 = require('${dataFile}');\n${evalContent}` : evalContent;
    try {
        const exampleRunFn = Function('ag_charts_community_1', 'AgCharts', 'time', 'Marker', 'require', evalExpr);
        return exampleRunFn(agCharts, AgCharts, time, Marker, require);
    }
    catch (error) {
        console.group();
        console.error(`unable to read example data for [${name}]; error: ${error.message}`);
        console.log(evalExpr);
        console.groupEnd();
        return [];
    }
}
exports.loadExampleOptions = loadExampleOptions;
function parseExampleOptions(evalFn, exampleJs, dataJs = '', evalGlobals = {}) {
    const evalExpr = [dataJs, cleanJs(exampleJs), `return ${evalFn};`].join('\n');
    const exampleRunFn = Function(...Object.keys(evalGlobals), evalExpr);
    return exampleRunFn(...Object.values(evalGlobals));
}
exports.parseExampleOptions = parseExampleOptions;
//# sourceMappingURL=load-example.js.map