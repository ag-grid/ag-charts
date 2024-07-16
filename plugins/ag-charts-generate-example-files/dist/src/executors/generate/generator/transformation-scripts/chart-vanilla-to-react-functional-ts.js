"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    processFunction: function() {
        return processFunction;
    },
    vanillaToReactFunctionalTs: function() {
        return vanillaToReactFunctionalTs;
    }
});
const _chartutils = require("./chart-utils");
const _parserutils = require("./parser-utils");
const _reactutils = require("./react-utils");
const _stringutils = require("./string-utils");
function processFunction(code) {
    return (0, _chartutils.wrapOptionsUpdateCode)((0, _parserutils.convertFunctionToProperty)(code), 'const clone = deepClone(options);', 'setOptions(clone);', 'clone');
}
function getImports(componentFilenames, bindings) {
    const reactImports = [
        'Fragment',
        'useState'
    ];
    if (bindings.usesChartApi) reactImports.push('useRef');
    const imports = [
        `import React, { ${reactImports.join(', ')} } from 'react';`,
        `import { createRoot } from 'react-dom/client';`,
        `import { AgChartsReact } from 'ag-charts-react';`
    ];
    if (bindings.imports.length > 0) {
        (0, _parserutils.addBindingImports)(bindings.imports, imports, false, true);
    }
    imports.push(`import deepClone from 'deepclone';`);
    if (componentFilenames) {
        imports.push(...componentFilenames.map(_reactutils.getImport));
    }
    return imports;
}
function getAgChartTag(bindings, componentAttributes) {
    return `<AgChartsReact
        ${bindings.usesChartApi ? 'ref={chartRef}' : ''}
        ${componentAttributes.join(`
        `)}
    />`;
}
function getTemplate(bindings, componentAttributes) {
    const agChartTag = getAgChartTag(bindings, componentAttributes);
    var _bindings_template;
    let template = (_bindings_template = bindings.template) != null ? _bindings_template : agChartTag;
    Object.values(bindings.placeholders).forEach((placeholder)=>{
        template = template.replace(placeholder, agChartTag);
    });
    return (0, _reactutils.convertFunctionalTemplate)(template);
}
function getComponentMetadata(bindings, property) {
    const { optionsTypeInfo, chartSettings: { enterprise = false } } = bindings;
    const stateProperties = [];
    const componentAttributes = [];
    var _optionsTypeInfo_typeStr;
    const chartOptionsType = (_optionsTypeInfo_typeStr = optionsTypeInfo == null ? void 0 : optionsTypeInfo.typeStr) != null ? _optionsTypeInfo_typeStr : 'AgChartOptions';
    stateProperties.push(`const [${property.name}, set${(0, _stringutils.toTitleCase)(property.name)}] = useState<${chartOptionsType}>(${property.value});`);
    if (enterprise) {
        // @todo(AG-8492): Temporary workaround for typings mismatch.
        componentAttributes.push(`options={${property.name} as any}`);
    } else {
        componentAttributes.push(`options={${property.name}}`);
    }
    return {
        stateProperties,
        componentAttributes
    };
}
async function vanillaToReactFunctionalTs(bindings, componentFilenames) {
    const { properties } = bindings;
    const imports = getImports(componentFilenames, bindings);
    const placeholders = Object.keys(bindings.placeholders);
    let indexFile;
    if (placeholders.length <= 1) {
        const { stateProperties, componentAttributes } = getComponentMetadata(bindings, properties.find((p)=>p.name === 'options'));
        const template = getTemplate(bindings, componentAttributes);
        const externalEventHandlers = bindings.externalEventHandlers.map((handler)=>processFunction((0, _reactutils.convertFunctionToCallback)(handler.body)));
        const instanceMethods = bindings.instanceMethods.map((m)=>processFunction((0, _reactutils.convertFunctionToCallback)(m)));
        indexFile = `
            ${imports.join(`
            `)}

            ${bindings.globals.join(`
            `)}

            const ChartExample = () => {
                ${bindings.usesChartApi ? `const chartRef = useRef<AgChartsReact>(null);` : ''}
                ${stateProperties.join(',\n            ')}

                ${instanceMethods.concat(externalEventHandlers).join('\n\n    ')}

                return ${template};
            }

            const root = createRoot(document.getElementById('root')!);
            root.render(<ChartExample />);
            `;
    } else {
        const components = new Map();
        indexFile = `
            ${imports.join(`
            `)}

            ${bindings.globals.join(`
            `)}
        `;
        placeholders.forEach((id)=>{
            const componentName = (0, _stringutils.toTitleCase)(id);
            const propertyName = bindings.chartProperties[id];
            const { stateProperties, componentAttributes } = getComponentMetadata(bindings, properties.find((p)=>p.name === propertyName));
            Object.entries(bindings.chartAttributes[id]).forEach(([key, value])=>{
                if (key === 'style') {
                    componentAttributes.push(`containerStyle={${JSON.stringify((0, _reactutils.styleAsObject)(value))}}`);
                } else {
                    throw new Error(`Unknown chart attribute: ${key}`);
                }
            });
            indexFile = `${indexFile}

            const ${componentName} = () => {
                ${stateProperties.join(`;
                `)}

                return ${getAgChartTag(bindings, componentAttributes)};
            }`;
            components.set(id, `<${componentName} />`);
        });
        let wrapper = (0, _reactutils.convertFunctionalTemplate)(bindings.template);
        Object.entries(bindings.placeholders).forEach(([id, template])=>{
            wrapper = wrapper.replace(template, components.get(id));
        });
        if (!bindings.template.includes('</')) {
            wrapper = `<Fragment>
                ${wrapper}
            </Fragment>`;
        }
        indexFile = `${indexFile}

        const root = createRoot(document.getElementById('root')!);
        root.render(
            ${wrapper}
        );
        `;
    }
    if (bindings.usesChartApi) {
        indexFile = indexFile.replace(/AgCharts.(\w*)\((\w*)(,|\))/g, 'AgCharts.$1(chartRef.current!.chart$3');
        indexFile = indexFile.replace(/\(this.chartRef.current.chart, options/g, '(chartRef.current!.chart, options');
    }
    return indexFile;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvY2hhcnQtdmFuaWxsYS10by1yZWFjdC1mdW5jdGlvbmFsLXRzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHdyYXBPcHRpb25zVXBkYXRlQ29kZSB9IGZyb20gJy4vY2hhcnQtdXRpbHMnO1xuaW1wb3J0IHsgYWRkQmluZGluZ0ltcG9ydHMsIGNvbnZlcnRGdW5jdGlvblRvUHJvcGVydHkgfSBmcm9tICcuL3BhcnNlci11dGlscyc7XG5pbXBvcnQgeyBjb252ZXJ0RnVuY3Rpb25Ub0NhbGxiYWNrLCBjb252ZXJ0RnVuY3Rpb25hbFRlbXBsYXRlLCBnZXRJbXBvcnQsIHN0eWxlQXNPYmplY3QgfSBmcm9tICcuL3JlYWN0LXV0aWxzJztcbmltcG9ydCB7IHRvVGl0bGVDYXNlIH0gZnJvbSAnLi9zdHJpbmctdXRpbHMnO1xuXG5leHBvcnQgZnVuY3Rpb24gcHJvY2Vzc0Z1bmN0aW9uKGNvZGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHdyYXBPcHRpb25zVXBkYXRlQ29kZShcbiAgICAgICAgY29udmVydEZ1bmN0aW9uVG9Qcm9wZXJ0eShjb2RlKSxcbiAgICAgICAgJ2NvbnN0IGNsb25lID0gZGVlcENsb25lKG9wdGlvbnMpOycsXG4gICAgICAgICdzZXRPcHRpb25zKGNsb25lKTsnLFxuICAgICAgICAnY2xvbmUnXG4gICAgKTtcbn1cblxuZnVuY3Rpb24gZ2V0SW1wb3J0cyhjb21wb25lbnRGaWxlbmFtZXM6IHN0cmluZ1tdLCBiaW5kaW5nczogYW55KTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHJlYWN0SW1wb3J0cyA9IFsnRnJhZ21lbnQnLCAndXNlU3RhdGUnXTtcbiAgICBpZiAoYmluZGluZ3MudXNlc0NoYXJ0QXBpKSByZWFjdEltcG9ydHMucHVzaCgndXNlUmVmJyk7XG5cbiAgICBjb25zdCBpbXBvcnRzID0gW1xuICAgICAgICBgaW1wb3J0IFJlYWN0LCB7ICR7cmVhY3RJbXBvcnRzLmpvaW4oJywgJyl9IH0gZnJvbSAncmVhY3QnO2AsXG4gICAgICAgIGBpbXBvcnQgeyBjcmVhdGVSb290IH0gZnJvbSAncmVhY3QtZG9tL2NsaWVudCc7YCxcbiAgICAgICAgYGltcG9ydCB7IEFnQ2hhcnRzUmVhY3QgfSBmcm9tICdhZy1jaGFydHMtcmVhY3QnO2AsXG4gICAgXTtcblxuICAgIGlmIChiaW5kaW5ncy5pbXBvcnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgYWRkQmluZGluZ0ltcG9ydHMoYmluZGluZ3MuaW1wb3J0cywgaW1wb3J0cywgZmFsc2UsIHRydWUpO1xuICAgIH1cblxuICAgIGltcG9ydHMucHVzaChgaW1wb3J0IGRlZXBDbG9uZSBmcm9tICdkZWVwY2xvbmUnO2ApO1xuXG4gICAgaWYgKGNvbXBvbmVudEZpbGVuYW1lcykge1xuICAgICAgICBpbXBvcnRzLnB1c2goLi4uY29tcG9uZW50RmlsZW5hbWVzLm1hcChnZXRJbXBvcnQpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW1wb3J0cztcbn1cblxuZnVuY3Rpb24gZ2V0QWdDaGFydFRhZyhiaW5kaW5nczogYW55LCBjb21wb25lbnRBdHRyaWJ1dGVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGA8QWdDaGFydHNSZWFjdFxuICAgICAgICAke2JpbmRpbmdzLnVzZXNDaGFydEFwaSA/ICdyZWY9e2NoYXJ0UmVmfScgOiAnJ31cbiAgICAgICAgJHtjb21wb25lbnRBdHRyaWJ1dGVzLmpvaW4oYFxuICAgICAgICBgKX1cbiAgICAvPmA7XG59XG5cbmZ1bmN0aW9uIGdldFRlbXBsYXRlKGJpbmRpbmdzOiBhbnksIGNvbXBvbmVudEF0dHJpYnV0ZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgICBjb25zdCBhZ0NoYXJ0VGFnID0gZ2V0QWdDaGFydFRhZyhiaW5kaW5ncywgY29tcG9uZW50QXR0cmlidXRlcyk7XG5cbiAgICBsZXQgdGVtcGxhdGU6IHN0cmluZyA9IGJpbmRpbmdzLnRlbXBsYXRlID8/IGFnQ2hhcnRUYWc7XG4gICAgT2JqZWN0LnZhbHVlcyhiaW5kaW5ncy5wbGFjZWhvbGRlcnMpLmZvckVhY2goKHBsYWNlaG9sZGVyOiBzdHJpbmcpID0+IHtcbiAgICAgICAgdGVtcGxhdGUgPSB0ZW1wbGF0ZS5yZXBsYWNlKHBsYWNlaG9sZGVyLCBhZ0NoYXJ0VGFnKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBjb252ZXJ0RnVuY3Rpb25hbFRlbXBsYXRlKHRlbXBsYXRlKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q29tcG9uZW50TWV0YWRhdGEoYmluZGluZ3M6IGFueSwgcHJvcGVydHk6IGFueSkge1xuICAgIGNvbnN0IHtcbiAgICAgICAgb3B0aW9uc1R5cGVJbmZvLFxuICAgICAgICBjaGFydFNldHRpbmdzOiB7IGVudGVycHJpc2UgPSBmYWxzZSB9LFxuICAgIH0gPSBiaW5kaW5ncztcblxuICAgIGNvbnN0IHN0YXRlUHJvcGVydGllcyA9IFtdO1xuICAgIGNvbnN0IGNvbXBvbmVudEF0dHJpYnV0ZXMgPSBbXTtcblxuICAgIGNvbnN0IGNoYXJ0T3B0aW9uc1R5cGUgPSBvcHRpb25zVHlwZUluZm8/LnR5cGVTdHIgPz8gJ0FnQ2hhcnRPcHRpb25zJztcblxuICAgIHN0YXRlUHJvcGVydGllcy5wdXNoKFxuICAgICAgICBgY29uc3QgWyR7cHJvcGVydHkubmFtZX0sIHNldCR7dG9UaXRsZUNhc2UocHJvcGVydHkubmFtZSl9XSA9IHVzZVN0YXRlPCR7Y2hhcnRPcHRpb25zVHlwZX0+KCR7cHJvcGVydHkudmFsdWV9KTtgXG4gICAgKTtcblxuICAgIGlmIChlbnRlcnByaXNlKSB7XG4gICAgICAgIC8vIEB0b2RvKEFHLTg0OTIpOiBUZW1wb3Jhcnkgd29ya2Fyb3VuZCBmb3IgdHlwaW5ncyBtaXNtYXRjaC5cbiAgICAgICAgY29tcG9uZW50QXR0cmlidXRlcy5wdXNoKGBvcHRpb25zPXske3Byb3BlcnR5Lm5hbWV9IGFzIGFueX1gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb21wb25lbnRBdHRyaWJ1dGVzLnB1c2goYG9wdGlvbnM9eyR7cHJvcGVydHkubmFtZX19YCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdGVQcm9wZXJ0aWVzLFxuICAgICAgICBjb21wb25lbnRBdHRyaWJ1dGVzLFxuICAgIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2YW5pbGxhVG9SZWFjdEZ1bmN0aW9uYWxUcyhiaW5kaW5nczogYW55LCBjb21wb25lbnRGaWxlbmFtZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCB7IHByb3BlcnRpZXMgfSA9IGJpbmRpbmdzO1xuICAgIGNvbnN0IGltcG9ydHMgPSBnZXRJbXBvcnRzKGNvbXBvbmVudEZpbGVuYW1lcywgYmluZGluZ3MpO1xuICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IE9iamVjdC5rZXlzKGJpbmRpbmdzLnBsYWNlaG9sZGVycyk7XG5cbiAgICBsZXQgaW5kZXhGaWxlOiBzdHJpbmc7XG5cbiAgICBpZiAocGxhY2Vob2xkZXJzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgIGNvbnN0IHsgc3RhdGVQcm9wZXJ0aWVzLCBjb21wb25lbnRBdHRyaWJ1dGVzIH0gPSBnZXRDb21wb25lbnRNZXRhZGF0YShcbiAgICAgICAgICAgIGJpbmRpbmdzLFxuICAgICAgICAgICAgcHJvcGVydGllcy5maW5kKChwKSA9PiBwLm5hbWUgPT09ICdvcHRpb25zJylcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IGdldFRlbXBsYXRlKGJpbmRpbmdzLCBjb21wb25lbnRBdHRyaWJ1dGVzKTtcblxuICAgICAgICBjb25zdCBleHRlcm5hbEV2ZW50SGFuZGxlcnMgPSBiaW5kaW5ncy5leHRlcm5hbEV2ZW50SGFuZGxlcnMubWFwKChoYW5kbGVyKSA9PlxuICAgICAgICAgICAgcHJvY2Vzc0Z1bmN0aW9uKGNvbnZlcnRGdW5jdGlvblRvQ2FsbGJhY2soaGFuZGxlci5ib2R5KSlcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgaW5zdGFuY2VNZXRob2RzID0gYmluZGluZ3MuaW5zdGFuY2VNZXRob2RzLm1hcCgobSkgPT4gcHJvY2Vzc0Z1bmN0aW9uKGNvbnZlcnRGdW5jdGlvblRvQ2FsbGJhY2sobSkpKTtcblxuICAgICAgICBpbmRleEZpbGUgPSBgXG4gICAgICAgICAgICAke2ltcG9ydHMuam9pbihgXG4gICAgICAgICAgICBgKX1cblxuICAgICAgICAgICAgJHtiaW5kaW5ncy5nbG9iYWxzLmpvaW4oYFxuICAgICAgICAgICAgYCl9XG5cbiAgICAgICAgICAgIGNvbnN0IENoYXJ0RXhhbXBsZSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAke2JpbmRpbmdzLnVzZXNDaGFydEFwaSA/IGBjb25zdCBjaGFydFJlZiA9IHVzZVJlZjxBZ0NoYXJ0c1JlYWN0PihudWxsKTtgIDogJyd9XG4gICAgICAgICAgICAgICAgJHtzdGF0ZVByb3BlcnRpZXMuam9pbignLFxcbiAgICAgICAgICAgICcpfVxuXG4gICAgICAgICAgICAgICAgJHtpbnN0YW5jZU1ldGhvZHMuY29uY2F0KGV4dGVybmFsRXZlbnRIYW5kbGVycykuam9pbignXFxuXFxuICAgICcpfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuICR7dGVtcGxhdGV9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCByb290ID0gY3JlYXRlUm9vdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9vdCcpISk7XG4gICAgICAgICAgICByb290LnJlbmRlcig8Q2hhcnRFeGFtcGxlIC8+KTtcbiAgICAgICAgICAgIGA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gICAgICAgIGluZGV4RmlsZSA9IGBcbiAgICAgICAgICAgICR7aW1wb3J0cy5qb2luKGBcbiAgICAgICAgICAgIGApfVxuXG4gICAgICAgICAgICAke2JpbmRpbmdzLmdsb2JhbHMuam9pbihgXG4gICAgICAgICAgICBgKX1cbiAgICAgICAgYDtcblxuICAgICAgICBwbGFjZWhvbGRlcnMuZm9yRWFjaCgoaWQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudE5hbWUgPSB0b1RpdGxlQ2FzZShpZCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IGJpbmRpbmdzLmNoYXJ0UHJvcGVydGllc1tpZF07XG4gICAgICAgICAgICBjb25zdCB7IHN0YXRlUHJvcGVydGllcywgY29tcG9uZW50QXR0cmlidXRlcyB9ID0gZ2V0Q29tcG9uZW50TWV0YWRhdGEoXG4gICAgICAgICAgICAgICAgYmluZGluZ3MsXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcy5maW5kKChwKSA9PiBwLm5hbWUgPT09IHByb3BlcnR5TmFtZSlcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIE9iamVjdC5lbnRyaWVzKGJpbmRpbmdzLmNoYXJ0QXR0cmlidXRlc1tpZF0pLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChrZXkgPT09ICdzdHlsZScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50QXR0cmlidXRlcy5wdXNoKGBjb250YWluZXJTdHlsZT17JHtKU09OLnN0cmluZ2lmeShzdHlsZUFzT2JqZWN0KHZhbHVlIGFzIGFueSkpfX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gY2hhcnQgYXR0cmlidXRlOiAke2tleX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaW5kZXhGaWxlID0gYCR7aW5kZXhGaWxlfVxuXG4gICAgICAgICAgICBjb25zdCAke2NvbXBvbmVudE5hbWV9ID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICR7c3RhdGVQcm9wZXJ0aWVzLmpvaW4oYDtcbiAgICAgICAgICAgICAgICBgKX1cblxuICAgICAgICAgICAgICAgIHJldHVybiAke2dldEFnQ2hhcnRUYWcoYmluZGluZ3MsIGNvbXBvbmVudEF0dHJpYnV0ZXMpfTtcbiAgICAgICAgICAgIH1gO1xuXG4gICAgICAgICAgICBjb21wb25lbnRzLnNldChpZCwgYDwke2NvbXBvbmVudE5hbWV9IC8+YCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCB3cmFwcGVyID0gY29udmVydEZ1bmN0aW9uYWxUZW1wbGF0ZShiaW5kaW5ncy50ZW1wbGF0ZSk7XG4gICAgICAgIE9iamVjdC5lbnRyaWVzKGJpbmRpbmdzLnBsYWNlaG9sZGVycykuZm9yRWFjaCgoW2lkLCB0ZW1wbGF0ZV06IFtzdHJpbmcsIHN0cmluZ10pID0+IHtcbiAgICAgICAgICAgIHdyYXBwZXIgPSB3cmFwcGVyLnJlcGxhY2UodGVtcGxhdGUsIGNvbXBvbmVudHMuZ2V0KGlkKSEpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIWJpbmRpbmdzLnRlbXBsYXRlLmluY2x1ZGVzKCc8LycpKSB7XG4gICAgICAgICAgICB3cmFwcGVyID0gYDxGcmFnbWVudD5cbiAgICAgICAgICAgICAgICAke3dyYXBwZXJ9XG4gICAgICAgICAgICA8L0ZyYWdtZW50PmA7XG4gICAgICAgIH1cblxuICAgICAgICBpbmRleEZpbGUgPSBgJHtpbmRleEZpbGV9XG5cbiAgICAgICAgY29uc3Qgcm9vdCA9IGNyZWF0ZVJvb3QoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jvb3QnKSEpO1xuICAgICAgICByb290LnJlbmRlcihcbiAgICAgICAgICAgICR7d3JhcHBlcn1cbiAgICAgICAgKTtcbiAgICAgICAgYDtcbiAgICB9XG5cbiAgICBpZiAoYmluZGluZ3MudXNlc0NoYXJ0QXBpKSB7XG4gICAgICAgIGluZGV4RmlsZSA9IGluZGV4RmlsZS5yZXBsYWNlKC9BZ0NoYXJ0cy4oXFx3KilcXCgoXFx3KikoLHxcXCkpL2csICdBZ0NoYXJ0cy4kMShjaGFydFJlZi5jdXJyZW50IS5jaGFydCQzJyk7XG4gICAgICAgIGluZGV4RmlsZSA9IGluZGV4RmlsZS5yZXBsYWNlKC9cXCh0aGlzLmNoYXJ0UmVmLmN1cnJlbnQuY2hhcnQsIG9wdGlvbnMvZywgJyhjaGFydFJlZi5jdXJyZW50IS5jaGFydCwgb3B0aW9ucycpO1xuICAgIH1cblxuICAgIHJldHVybiBpbmRleEZpbGU7XG59XG4iXSwibmFtZXMiOlsicHJvY2Vzc0Z1bmN0aW9uIiwidmFuaWxsYVRvUmVhY3RGdW5jdGlvbmFsVHMiLCJjb2RlIiwid3JhcE9wdGlvbnNVcGRhdGVDb2RlIiwiY29udmVydEZ1bmN0aW9uVG9Qcm9wZXJ0eSIsImdldEltcG9ydHMiLCJjb21wb25lbnRGaWxlbmFtZXMiLCJiaW5kaW5ncyIsInJlYWN0SW1wb3J0cyIsInVzZXNDaGFydEFwaSIsInB1c2giLCJpbXBvcnRzIiwiam9pbiIsImxlbmd0aCIsImFkZEJpbmRpbmdJbXBvcnRzIiwibWFwIiwiZ2V0SW1wb3J0IiwiZ2V0QWdDaGFydFRhZyIsImNvbXBvbmVudEF0dHJpYnV0ZXMiLCJnZXRUZW1wbGF0ZSIsImFnQ2hhcnRUYWciLCJ0ZW1wbGF0ZSIsIk9iamVjdCIsInZhbHVlcyIsInBsYWNlaG9sZGVycyIsImZvckVhY2giLCJwbGFjZWhvbGRlciIsInJlcGxhY2UiLCJjb252ZXJ0RnVuY3Rpb25hbFRlbXBsYXRlIiwiZ2V0Q29tcG9uZW50TWV0YWRhdGEiLCJwcm9wZXJ0eSIsIm9wdGlvbnNUeXBlSW5mbyIsImNoYXJ0U2V0dGluZ3MiLCJlbnRlcnByaXNlIiwic3RhdGVQcm9wZXJ0aWVzIiwiY2hhcnRPcHRpb25zVHlwZSIsInR5cGVTdHIiLCJuYW1lIiwidG9UaXRsZUNhc2UiLCJ2YWx1ZSIsInByb3BlcnRpZXMiLCJrZXlzIiwiaW5kZXhGaWxlIiwiZmluZCIsInAiLCJleHRlcm5hbEV2ZW50SGFuZGxlcnMiLCJoYW5kbGVyIiwiY29udmVydEZ1bmN0aW9uVG9DYWxsYmFjayIsImJvZHkiLCJpbnN0YW5jZU1ldGhvZHMiLCJtIiwiZ2xvYmFscyIsImNvbmNhdCIsImNvbXBvbmVudHMiLCJNYXAiLCJpZCIsImNvbXBvbmVudE5hbWUiLCJwcm9wZXJ0eU5hbWUiLCJjaGFydFByb3BlcnRpZXMiLCJlbnRyaWVzIiwiY2hhcnRBdHRyaWJ1dGVzIiwia2V5IiwiSlNPTiIsInN0cmluZ2lmeSIsInN0eWxlQXNPYmplY3QiLCJFcnJvciIsInNldCIsIndyYXBwZXIiLCJnZXQiLCJpbmNsdWRlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFLZ0JBLGVBQWU7ZUFBZkE7O0lBK0VNQywwQkFBMEI7ZUFBMUJBOzs7NEJBcEZnQjs2QkFDdUI7NEJBQ2tDOzZCQUNuRTtBQUVyQixTQUFTRCxnQkFBZ0JFLElBQVk7SUFDeEMsT0FBT0MsSUFBQUEsaUNBQXFCLEVBQ3hCQyxJQUFBQSxzQ0FBeUIsRUFBQ0YsT0FDMUIscUNBQ0Esc0JBQ0E7QUFFUjtBQUVBLFNBQVNHLFdBQVdDLGtCQUE0QixFQUFFQyxRQUFhO0lBQzNELE1BQU1DLGVBQWU7UUFBQztRQUFZO0tBQVc7SUFDN0MsSUFBSUQsU0FBU0UsWUFBWSxFQUFFRCxhQUFhRSxJQUFJLENBQUM7SUFFN0MsTUFBTUMsVUFBVTtRQUNaLENBQUMsZ0JBQWdCLEVBQUVILGFBQWFJLElBQUksQ0FBQyxNQUFNLGdCQUFnQixDQUFDO1FBQzVELENBQUMsOENBQThDLENBQUM7UUFDaEQsQ0FBQyxnREFBZ0QsQ0FBQztLQUNyRDtJQUVELElBQUlMLFNBQVNJLE9BQU8sQ0FBQ0UsTUFBTSxHQUFHLEdBQUc7UUFDN0JDLElBQUFBLDhCQUFpQixFQUFDUCxTQUFTSSxPQUFPLEVBQUVBLFNBQVMsT0FBTztJQUN4RDtJQUVBQSxRQUFRRCxJQUFJLENBQUMsQ0FBQyxrQ0FBa0MsQ0FBQztJQUVqRCxJQUFJSixvQkFBb0I7UUFDcEJLLFFBQVFELElBQUksSUFBSUosbUJBQW1CUyxHQUFHLENBQUNDLHFCQUFTO0lBQ3BEO0lBRUEs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