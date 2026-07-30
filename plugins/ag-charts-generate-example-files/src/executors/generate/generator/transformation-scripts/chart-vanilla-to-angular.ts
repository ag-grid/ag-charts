import { convertTemplate, getImport } from './angular-utils';
import { wrapOptionsUpdateCode } from './chart-utils';
import {
    type ChartAPI,
    addBindingImports,
    chartApi,
    convertFunctionToProperty,
    isInstanceMethod,
} from './parser-utils';
import { toKebabCase, toTitleCase } from './string-utils';

const components: Record<ChartAPI, string> = {
    gauge: 'AgGauge',
    financial: 'AgFinancialCharts',
    sparkline: 'AgSparkline',
    vanilla: 'AgCharts',
};

const tags: Record<ChartAPI, string> = {
    gauge: 'ag-gauge',
    financial: 'ag-financial-charts',
    sparkline: 'ag-sparkline',
    vanilla: 'ag-charts',
};

function processFunction(code: string, suppressOptionsClone: boolean, methodNames: string[] = []): string {
    const processed = wrapOptionsUpdateCode(
        convertFunctionToProperty(code),
        'this.options',
        undefined,
        undefined,
        !suppressOptionsClone
    );

    return prefixInstanceMethodCalls(processed, methodNames);
}

// Matches JS string literals, template literals, and comments. Their contents must be treated as
// opaque text when prefixing instance-method calls — otherwise a method name that happens to appear
// as a substring inside a string (e.g. `repeat` inside `'no-repeat'`) would be wrongly rewritten.
const STRINGS_AND_COMMENTS = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|\/\/[^\n]*|\/\*[\s\S]*?\*\//g;

// Add this. prefix to instance method calls within the given code
function prefixInstanceMethodCalls(code: string, methodNames: string[]): string {
    const targets = methodNames.filter((methodName) => !GLOBAL_FUNCTIONS.includes(methodName));
    if (targets.length === 0) {
        return code;
    }

    const prefixCodeSegment = (segment: string): string => {
        targets.forEach((methodName) => {
            // Object-literal shorthand ({ method }) must expand to a full property ({ method: this.method });
            // a bare `this.` prefix there would be invalid syntax.
            const shorthandRegex = new RegExp(`(?<=[{,]\\s*)\\b${methodName}\\b(?=\\s*[,}])`, 'g');
            segment = segment.replace(shorthandRegex, `${methodName}: this.${methodName}`);
            // Negative lookbehind: not preceded by '.' (covers this.method, obj.method, etc.)
            // Negative lookahead: not followed by '=' or ':' (for declarations like 'method = ')
            // https://regex101.com/r/u79W6c/4
            const regex = new RegExp(`(?<!\\.)\\b${methodName}\\b(?!\\s*[=:])`, 'g');
            segment = segment.replace(regex, `this.${methodName}`);
        });
        return segment;
    };

    // Prefix only the code between string/template/comment literals; emit the literals verbatim so
    // their contents are never rewritten.
    let result = '';
    let lastIndex = 0;
    for (const match of code.matchAll(STRINGS_AND_COMMENTS)) {
        const start = match.index ?? 0;
        result += prefixCodeSegment(code.slice(lastIndex, start)) + match[0];
        lastIndex = start + match[0].length;
    }
    result += prefixCodeSegment(code.slice(lastIndex));

    return result;
}

function getImports(bindings, componentFileNames: string[], { typeParts }): string[] {
    const {
        chartSettings: { enterprise = false },
    } = bindings;

    const type = components[chartApi(bindings)];
    const declaredTypeNames = bindings.declaredTypeNames ?? [];
    const bImports = bindings.imports.map((i) => ({
        ...i,
        imports: i.imports.filter((imp) => imp !== 'AgCharts'),
    }));
    // Skip type parts already imported by the example (e.g. from 'ag-charts-types') to avoid duplicate imports.
    const alreadyImported = new Set(bImports.flatMap((i) => i.imports));
    bImports.push({
        module: enterprise ? `'ag-charts-enterprise'` : `'ag-charts-community'`,
        isNamespaced: false,
        imports: typeParts.filter((imp) => !declaredTypeNames.includes(imp) && !alreadyImported.has(imp)),
    });

    const imports = [`import { Component${bindings.usesChartApi ? ', ViewChild' : ''} } from '@angular/core';`];
    imports.push(`import { ${type} } from 'ag-charts-angular';`);

    addBindingImports([...bImports], imports, true, true);

    if (componentFileNames) {
        imports.push(...componentFileNames.map(getImport));
    }

    if (bindings.externalEventHandlers.length > 0 || bindings.instanceMethods.length > 0) {
        imports.push(`import clone from 'clone';`);
    }

    return imports;
}

function getComponentMetadata(bindings: any, property: any, methodNames: string[]) {
    const propertyAttributes = [];
    const propertyVars = [];
    const propertyAssignments = [];

    if (!isInstanceMethod(bindings.instanceMethods, property)) {
        propertyAttributes.push(`[options]="${property.name}"`);
        propertyVars.push(`public ${property.name};`);
        // Callbacks inside the options literal may call instance methods, so prefix those calls too.
        propertyAssignments.push(`this.${property.name} = ${prefixInstanceMethodCalls(property.value, methodNames)};`);
    }

    return { propertyAttributes, propertyVars, propertyAssignments };
}

function getAngularTag(bindings: any, attributes: string[]) {
    const tag = tags[chartApi(bindings)];
    return `<${tag}
        ${attributes.join(`
        `)}
    ></${tag}>`;
}

function getTemplate(bindings: any, id: string, attributes: string[]): string {
    attributes = [...attributes];

    Object.entries(bindings.chartAttributes[id]).forEach(([key, value]) => {
        if (key === 'style') {
            attributes.push(`style=${JSON.stringify(value as any)}`);
        } else if (key === 'class') {
            attributes.push(`class=${JSON.stringify(value as any)}`);
        } else {
            throw new Error(`Unknown chart attribute: ${key}`);
        }
    });

    const agChartTag = getAngularTag(bindings, attributes);

    let template = bindings.template ?? agChartTag;
    Object.values(bindings.placeholders).forEach((placeholder) => {
        template = template.replace(placeholder, agChartTag);
    });

    return convertTemplate(template);
}

// Built-in/global functions that should NOT be transformed with this. prefix
const GLOBAL_FUNCTIONS = [
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'setTimeout',
    'setInterval',
    'clearTimeout',
    'clearInterval',
    'performance',
    'console',
    'Math',
    'JSON',
    'Object',
    'Array',
    'Date',
    'String',
    'Number',
    'Boolean',
    'Error',
    'parseInt',
    'parseFloat',
    'isNaN',
    'isFinite',
    'encodeURIComponent',
    'decodeURIComponent',
    'clone', // from imports
];

function getInstanceMethodNames(bindings: any): string[] {
    const eventHandlerNames = bindings.externalEventHandlers.map((h) => h.name);
    const instanceMethodNames = bindings.instanceMethods
        .map((m) => {
            // Extract function name from declaration
            // Handles: "function methodName()" (including async), "methodName = () =>", and "methodName: () =>"
            const fnDeclMatch = m.match(/^\s*(?:async\s+)?function\s+(\w+)\s*\(/);
            if (fnDeclMatch) {
                return fnDeclMatch[1];
            }
            const match = m.match(/^\s*(\w+)\s*[=:]/);
            return match ? match[1] : null;
        })
        .filter(Boolean);
    return [...eventHandlerNames, ...instanceMethodNames];
}

export async function vanillaToAngular(
    bindings: any,
    componentFileNames: string[],
    suppressOptionsClone: boolean
): Promise<string> {
    const { properties, declarations, optionsTypeInfo } = bindings;
    const type = components[chartApi(bindings)];
    const opsTypeInfo = optionsTypeInfo;
    const imports = getImports(bindings, componentFileNames, opsTypeInfo);
    const placeholders = Object.keys(bindings.placeholders);

    let indexFile: string;

    if (placeholders.length <= 1) {
        // Get method names first so we can transform calls within method bodies and the options literal
        const methodNames = getInstanceMethodNames(bindings);

        const options = properties.find((p) => p.name === 'options');
        const { propertyAttributes, propertyAssignments, propertyVars } = getComponentMetadata(
            bindings,
            options,
            methodNames
        );
        const template = getTemplate(bindings, placeholders[0], propertyAttributes);

        const instanceMethods = bindings.instanceMethods.map((v) =>
            processFunction(v, suppressOptionsClone, methodNames)
        );
        const externalEventHandlers = bindings.externalEventHandlers.map((handler) =>
            processFunction(handler.body, suppressOptionsClone, methodNames)
        );

        indexFile = `${imports.join('\n')}${declarations.length > 0 ? '\n\n' + declarations.join('\n') : ''}

        ${bindings.globals.join('\n')}

        @Component({
            selector: 'my-app',
            standalone: true,
            imports: [${type}],
            template: \`${template}\`
        })
        export class AppComponent {
            ${propertyVars.join(`
            `)}

            ${
                bindings.usesChartApi
                    ? `\n    @ViewChild(${type})
            public agCharts!: ${type};\n`
                    : ''
            }
            constructor() {
                ${propertyAssignments.join(';\n')}
            }

            ${
                bindings.init.length !== 0
                    ? `
            ngOnInit() {
                ${prefixInstanceMethodCalls(bindings.init.join(';\n    '), methodNames)}
            }
            `
                    : ''
            }

            ${instanceMethods
                .concat(externalEventHandlers)
                .map((snippet) => snippet.trim())
                .join('\n\n')}
        }
        `;

        // @todo(AG-14126, CRT-1003) - handle listener events correctly
        indexFile = indexFile.replace('toggleDatum(event.datum);', 'this.toggleDatum(event.datum);');
    } else {
        const components: Array<{ selector: string; className: string }> = [];

        let template = bindings.template.trim();
        Object.entries(bindings.placeholders).forEach(([id, placeholder]) => {
            const selector = toKebabCase(id);
            let { style } = bindings.chartAttributes[id];
            // display: grid needed because Angular adds additional dom nodes compared to other frameworks
            style = `display: grid; ${style}`.trim();
            template = template.replace(placeholder, `<${selector} style="${style}"></${selector}>`);
        });

        indexFile = `${imports.join('\n')}${declarations.length > 0 ? '\n\n' + declarations.join('\n') : ''}

        ${bindings.globals.join('\n')}
        `;

        placeholders.forEach((id) => {
            const selector = toKebabCase(id);
            const className = toTitleCase(id);

            const propertyName = bindings.chartProperties[id];
            // The multi-chart path never emits instanceMethods/externalEventHandlers onto the generated
            // components, so prefixing calls with this. would reference members that do not exist.
            const { propertyAttributes, propertyAssignments, propertyVars } = getComponentMetadata(
                bindings,
                properties.find((p) => p.name === propertyName),
                []
            );

            const template = getAngularTag(bindings, propertyAttributes);

            indexFile = `${indexFile}

            @Component({
                selector: '${selector}',
                standalone: true,
                imports: [${type}],
                template: \`${template}\`
            })
            class ${className} {
                ${propertyVars.join(`
                `)}

                constructor() {
                    ${propertyAssignments.join(';\n')}
                }
            }`;

            components.push({ selector, className });
        });

        indexFile = `${indexFile}

        @Component({
            selector: 'my-app',
            standalone: true,
            imports: [${components.map((c) => c.className).join(', ')}],
            template: \`${template}\`
        })
        export class AppComponent {
        }
        `;
    }

    if (bindings.usesChartApi) {
        indexFile = indexFile.replace(/AgCharts.(\w*)\((\w*)(,|\))/g, 'AgCharts.$1(this.agCharts.chart!$3');
        indexFile = indexFile.replace(/chart.(\w*)\(/g, 'this.agCharts.chart!.$1(');
        indexFile = indexFile.replace(/this.agCharts.chart!.(\w*)\(options/g, 'this.agCharts.chart!.$1(this.options');
        // Split multi-variable declarations containing 'chart' to avoid breaking syntax
        indexFile = indexFile.replace(/\b(let|const|var)\s+chart\s*,\s*(\w+)/g, '$1 chart;\n    $1 $2');
        // Replace `chart` references but not in variable declarations or strings
        indexFile = indexFile.replace(
            /(['"])(?:\\.|(?!\1).)*\1|\b(?<!\blet\s)(?<!\bconst\s)(?<!\bvar\s)(?<!\.)\bchart\b/g,
            (match) => (match === 'chart' ? 'this.agCharts.chart!' : match)
        );
    }

    return indexFile;
}
