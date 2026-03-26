// @ag-skip-fws
import { AgBarSeriesOptions, AgChartOptions, AgCharts } from 'ag-charts-community';

interface IData {
    // Chart Data Interface
    month: 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun' | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec';
    avgTemp: number;
    iceCreamSales: number;
}

// Chart Options
const options: AgChartOptions = {
    container: document.getElementById('myChart'), // Container: HTML Element to hold the chart
    // Data: Data to be displayed in the chart
    data: [
        { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162000 },
        { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302000 },
        { month: 'May', avgTemp: 16.2, iceCreamSales: 800000 },
        { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254000 },
        { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950000 },
        { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200000 },
    ] as IData[],
    // Series: Defines which chart type and data to use
    series: [{ type: 'bar', xKey: 'month', yKey: 'iceCreamSales' } as AgBarSeriesOptions],
};

const chart = AgCharts.create(options);
chart.waitForUpdate().then(() => {
    generateControls();
});

// Mock classes
const FakeGrid = class {};
const AgColumn = class {
    colId = 'someColId';
};
const RowNode = class {
    id = '2';
};

const CONSOLE_LOG_ARGS = [
    ['string'],
    [23],
    [null],
    [undefined],
    [NaN],
    [true, false],
    ['string', 23, null, undefined, true, false],
    [[]],
    [['string']],
    [['string', 23, null, undefined, true, false]],
    [[{ a: 'string', b: 23, c: null }, 23, null, undefined, true, false]],
    [[{}]],
    [{ a: 'string', b: 23, c: null }],
    [{ c: 'string', b: 23, a: null }],
    [{ undefined: undefined, nan: NaN, null: null, infinity: Infinity, negativeInfinity: -Infinity }],
    [{ a: 'more', b: 'here', c: undefined, d: 'more' }],
    [
        'string',
        23,
        null,
        undefined,
        true,
        false,
        { a: 'more', b: 'here', c: 'now', d: 'more' },
        { a: 'more', b: 'here', c: 'now', d: 'more' },
        { a: 'more', b: 'here', c: 'now', d: 'more' },
        { a: 'more', b: 'here', c: 'now', d: 'more' },
        { a: 'more', b: 'here', c: 'now', d: 'more' },
        'asdfasdfsadfsadfds asdfasdfsadfsadfds asdfasdfsadfsadfds asdfasdfsadfsadfds asdfasdfsadfsadfds asdfasdfsadfsadfds asdfasdfsadfsadfds asdfasdfsadfsadfds',
    ],
    // Browser objects that render differently than console
    [window, document, document.createElement('div')],
    [new CSSStyleSheet(), new Event('click'), new FakeGrid()],
    // AG Grid replacement classes
    [new AgColumn()],
    [new RowNode()],
];
const PRIMITIVE_TYPES = ['string', 'number', 'boolean', 'undefined', 'null', 'nan', 'symbol'];
const REPLACEMENT_TYPES_MAP: Record<string, any> = {
    undefined: undefined,
    nan: NaN,
    infinity: Infinity,
    negativeInfinity: -Infinity,
};
const REPLACEMENT_TYPES = [
    'undefined',
    'nan',
    'infinity',
    'negativeInfinity',
    'classInstance',
    'event',
    'cssStylesheet',
    'element',
    'document',
    'window',
];
const getReplacementValue = (value: any) => {
    const valueType = getType(value);
    if (valueType === 'classInstance') {
        return value.constructor.name + 'Class {}';
    } else if (valueType === 'event') {
        return value.constructor.name + ' { type: ' + value.type + ' }';
    } else if (valueType === 'cssStylesheet') {
        return value.constructor.name + ' {}';
    } else if (valueType === 'element') {
        return 'Element { ' + value.localName + ' }';
    } else if (valueType === 'document') {
        return 'Document {}';
    } else if (valueType === 'window') {
        return 'Window {}';
    }

    return `[TYPE:${valueType}]`;
};

const MATCH_TYPE_REGEXP = /\[TYPE:([^\]]+)]/g;
const MATCH_TYPE_WITH_QUOTES_REGEXP = /"\[TYPE:([^\]]+)]"/g;
const getReplacementType = (typeValue: string) => {
    const matches = MATCH_TYPE_REGEXP.exec(typeValue);
    return matches ? matches[1] : undefined;
};

function getType(value: any) {
    if (value === null) return 'null';
    if (Number.isNaN(value)) return 'nan';
    if (Array.isArray(value)) return 'array';
    if (value === Infinity) return 'infinity';
    if (value === -Infinity) return 'negativeInfinity';
    if (value instanceof Date) return 'date';
    if (value instanceof RegExp) return 'regexp';
    if (value instanceof Map) return 'map';
    if (value instanceof Set) return 'set';
    if (value instanceof Event) return 'event';
    if (value instanceof Element) return 'element';
    if (value instanceof Document) return 'document';
    if (value instanceof Window) return 'window';
    if (value instanceof CSSStyleSheet || (typeof value === 'object' && value.constructor.name === 'CSSStyleSheet'))
        return 'cssStylesheet';
    if (value instanceof WeakMap) return 'weakmap';
    if (value instanceof WeakSet) return 'weakset';
    if (value instanceof Promise) return 'promise';
    if (value instanceof Error) return 'error';
    if (
        typeof value === 'object' &&
        value !== null &&
        value.constructor &&
        value.constructor.toString().startsWith('class ')
    )
        return 'classInstance';
    if (typeof value === 'object') return 'object';
    return typeof value;
}

function isPrimitiveType(value: any) {
    return PRIMITIVE_TYPES.includes(getType(value));
}

function updateWithReplacements(originalValue: any, replacementTypes: any) {
    const seen = new WeakSet();

    const updateWithReplacementsRecursively = (value: any) => {
        const valueType = getType(value);

        if (seen.has(value)) {
            if (replacementTypes.includes(valueType)) {
                return getReplacementValue(value);
            } else {
                return '[Circular]';
            }
        }

        if (replacementTypes.includes(valueType)) {
            return getReplacementValue(value);
        } else if (valueType === 'array') {
            return value.map((item: any) => updateWithReplacementsRecursively(item));
        } else if (valueType === 'object') {
            const obj = { ...value };

            seen.add(value);

            for (const key in value) {
                const objValue = value[key];
                const objValueType = getType(objValue);

                if (replacementTypes.includes(objValueType)) {
                    obj[key] = getReplacementValue(objValue);
                } else {
                    obj[key] = updateWithReplacementsRecursively(objValue);
                }
            }

            return obj;
        } else {
            return value;
        }
    };

    return updateWithReplacementsRecursively(originalValue);
}

function replaceTypeString({ str, withQuotes }: { str: string; withQuotes?: boolean }) {
    const regex = withQuotes ? MATCH_TYPE_WITH_QUOTES_REGEXP : MATCH_TYPE_REGEXP;
    return str.replaceAll(regex, (_, typeValue) => {
        return REPLACEMENT_TYPES_MAP[typeValue];
    });
}

function stringify(value: any) {
    const valueType = getType(value);
    let output = '';
    if (valueType === 'null') {
        output = 'null';
    } else if (valueType === 'undefined') {
        output = 'undefined';
    } else if (valueType === 'string') {
        const replacementType = getReplacementType(value);
        if (replacementType && REPLACEMENT_TYPES.includes(replacementType)) {
            output = replaceTypeString({ str: value });
        } else {
            output = `"${value}"`;
        }
    } else if (isPrimitiveType(value)) {
        output = value.toString();
    } else {
        output = JSON.stringify(value);
        output = replaceTypeString({ str: output, withQuotes: true });
    }

    return output;
}

function generateControls() {
    const controls = document.querySelector<HTMLElement>('.example-controls')!;

    const logControls = CONSOLE_LOG_ARGS.map((args) => {
        const container = document.createElement('div');
        container.classList.add('controls-row');
        const pre = document.createElement('pre');
        const button = document.createElement('button');

        button.textContent = 'Log';
        button.addEventListener('click', () => {
            console.log(...args);
        });
        container.appendChild(button);

        pre.textContent = `console.log(${args.map((arg) => stringify(updateWithReplacements(arg, REPLACEMENT_TYPES))).join(', ')})`;
        container.appendChild(pre);

        return container;
    });

    logControls.forEach((control) => {
        controls.appendChild(control);
    });
}
