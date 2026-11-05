declare const AgCharts: { create(options: object): { update(options: object): void; download(): void } };
declare class Feed {
    constructor(callback: () => void);
}

const options = { data: [] as number[] };
const chart = AgCharts.create(options);

function test_IncorrectReadsOptions() {
    options.data = [];
}

function test_IncorrectReadsChart() {
    chart.download();
}

/** inScope */
function test_CorrectInScope() {
    chart.update(options);
}

/** inScope */
export function test_CorrectExportedInScope() {
    chart.update(options);
}

function test_CorrectHandler() {
    chart.update(options);
    test_IncorrectCalledOnlyFromHandler();
}

function test_IncorrectCalledOnlyFromHandler() {
    chart.download();
}

function test_IncorrectCallsInScope() {
    test_CorrectInScope();
}

const test_IncorrectInitialiser = test_CorrectInScope();

const test_IncorrectClosureInitialiser = new Feed(() => test_CorrectHandler());

const test_IncorrectArrowHelper = () => chart.update(options);

/** inScope */
const test_IncorrectInScopeArrow = () => chart.download();

function test_CorrectShadowedParams(chart: { download(): void }, options: object) {
    chart.download();
    return options;
}

function test_CorrectShadowedLocal() {
    const options = {};
    return options;
}

function test_CorrectTypePosition(value: typeof options): typeof chart | undefined {
    return value ? undefined : undefined;
}

const test_CorrectInitialiserReadsChart = chart;

const test_CorrectDomInitialiser = document.getElementById('x')!.addEventListener('click', () => test_CorrectHandler());

test_CorrectHandlerOnly();

function test_CorrectHandlerOnly() {
    test_CorrectHandler();
}
