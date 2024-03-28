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
    return (0, _chartutils.wrapOptionsUpdateCode)((0, _parserutils.convertFunctionToProperty)(code), 'const clone = {...options};', 'setOptions(clone);', 'clone');
}
function getImports(componentFilenames, bindings) {
    var _bindings_externalEventHandlers, _bindings_instanceMethods;
    const useCallback = ((_bindings_externalEventHandlers = bindings.externalEventHandlers) == null ? void 0 : _bindings_externalEventHandlers.length) + ((_bindings_instanceMethods = bindings.instanceMethods) == null ? void 0 : _bindings_instanceMethods.length) > 0;
    const reactImports = [
        'Fragment',
        'useState'
    ];
    if (useCallback) reactImports.push('useCallback');
    if (bindings.usesChartApi) reactImports.push('useRef');
    const imports = [
        `import React, { ${reactImports.join(', ')} } from 'react';`,
        `import { createRoot } from 'react-dom/client';`
    ];
    imports.push(`import { AgChartsReact } from 'ag-charts-react';`);
    if (bindings.imports.length > 0) {
        (0, _parserutils.addBindingImports)(bindings.imports, imports, false, true);
    }
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
        const externalEventHandlers = bindings.externalEventHandlers.map((handler)=>processFunction((0, _reactutils.convertFunctionToConstCallback)(handler.body, bindings.callbackDependencies)));
        const instanceMethods = bindings.instanceMethods.map((m)=>processFunction((0, _reactutils.convertFunctionToConstCallback)(m, bindings.callbackDependencies)));
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
        const components = [];
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
            components.push(`<${componentName} />`);
        });
        indexFile = `${indexFile}

        const root = createRoot(document.getElementById('root')!);
        root.render(
            <Fragment>
                ${components.join(`
                `)}
            </Fragment>
        );
        `;
    }
    if (bindings.usesChartApi) {
        indexFile = indexFile.replace(/AgCharts.(\w*)\((\w*)(,|\))/g, 'AgCharts.$1(chartRef.current!.chart$3');
        indexFile = indexFile.replace(/\(this.chartRef.current.chart, options/g, '(chartRef.current!.chart, options');
    }
    return indexFile;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvY2hhcnQtdmFuaWxsYS10by1yZWFjdC1mdW5jdGlvbmFsLXRzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHdyYXBPcHRpb25zVXBkYXRlQ29kZSB9IGZyb20gJy4vY2hhcnQtdXRpbHMnO1xuaW1wb3J0IHsgYWRkQmluZGluZ0ltcG9ydHMsIGNvbnZlcnRGdW5jdGlvblRvUHJvcGVydHkgfSBmcm9tICcuL3BhcnNlci11dGlscyc7XG5pbXBvcnQgeyBjb252ZXJ0RnVuY3Rpb25Ub0NvbnN0Q2FsbGJhY2ssIGNvbnZlcnRGdW5jdGlvbmFsVGVtcGxhdGUsIGdldEltcG9ydCwgc3R5bGVBc09iamVjdCB9IGZyb20gJy4vcmVhY3QtdXRpbHMnO1xuaW1wb3J0IHsgdG9UaXRsZUNhc2UgfSBmcm9tICcuL3N0cmluZy11dGlscyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9jZXNzRnVuY3Rpb24oY29kZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gd3JhcE9wdGlvbnNVcGRhdGVDb2RlKFxuICAgICAgICBjb252ZXJ0RnVuY3Rpb25Ub1Byb3BlcnR5KGNvZGUpLFxuICAgICAgICAnY29uc3QgY2xvbmUgPSB7Li4ub3B0aW9uc307JyxcbiAgICAgICAgJ3NldE9wdGlvbnMoY2xvbmUpOycsXG4gICAgICAgICdjbG9uZSdcbiAgICApO1xufVxuXG5mdW5jdGlvbiBnZXRJbXBvcnRzKGNvbXBvbmVudEZpbGVuYW1lczogc3RyaW5nW10sIGJpbmRpbmdzOiBhbnkpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgdXNlQ2FsbGJhY2sgPSBiaW5kaW5ncy5leHRlcm5hbEV2ZW50SGFuZGxlcnM/Lmxlbmd0aCArIGJpbmRpbmdzLmluc3RhbmNlTWV0aG9kcz8ubGVuZ3RoID4gMDtcblxuICAgIGNvbnN0IHJlYWN0SW1wb3J0cyA9IFsnRnJhZ21lbnQnLCAndXNlU3RhdGUnXTtcbiAgICBpZiAodXNlQ2FsbGJhY2spIHJlYWN0SW1wb3J0cy5wdXNoKCd1c2VDYWxsYmFjaycpO1xuICAgIGlmIChiaW5kaW5ncy51c2VzQ2hhcnRBcGkpIHJlYWN0SW1wb3J0cy5wdXNoKCd1c2VSZWYnKTtcblxuICAgIGNvbnN0IGltcG9ydHMgPSBbXG4gICAgICAgIGBpbXBvcnQgUmVhY3QsIHsgJHtyZWFjdEltcG9ydHMuam9pbignLCAnKX0gfSBmcm9tICdyZWFjdCc7YCxcbiAgICAgICAgYGltcG9ydCB7IGNyZWF0ZVJvb3QgfSBmcm9tICdyZWFjdC1kb20vY2xpZW50JztgLFxuICAgIF07XG5cbiAgICBpbXBvcnRzLnB1c2goYGltcG9ydCB7IEFnQ2hhcnRzUmVhY3QgfSBmcm9tICdhZy1jaGFydHMtcmVhY3QnO2ApO1xuXG4gICAgaWYgKGJpbmRpbmdzLmltcG9ydHMubGVuZ3RoID4gMCkge1xuICAgICAgICBhZGRCaW5kaW5nSW1wb3J0cyhiaW5kaW5ncy5pbXBvcnRzLCBpbXBvcnRzLCBmYWxzZSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgaWYgKGNvbXBvbmVudEZpbGVuYW1lcykge1xuICAgICAgICBpbXBvcnRzLnB1c2goLi4uY29tcG9uZW50RmlsZW5hbWVzLm1hcChnZXRJbXBvcnQpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW1wb3J0cztcbn1cblxuZnVuY3Rpb24gZ2V0QWdDaGFydFRhZyhiaW5kaW5nczogYW55LCBjb21wb25lbnRBdHRyaWJ1dGVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGA8QWdDaGFydHNSZWFjdFxuICAgICAgICAke2JpbmRpbmdzLnVzZXNDaGFydEFwaSA/ICdyZWY9e2NoYXJ0UmVmfScgOiAnJ31cbiAgICAgICAgJHtjb21wb25lbnRBdHRyaWJ1dGVzLmpvaW4oYFxuICAgICAgICBgKX1cbiAgICAvPmA7XG59XG5cbmZ1bmN0aW9uIGdldFRlbXBsYXRlKGJpbmRpbmdzOiBhbnksIGNvbXBvbmVudEF0dHJpYnV0ZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgICBjb25zdCBhZ0NoYXJ0VGFnID0gZ2V0QWdDaGFydFRhZyhiaW5kaW5ncywgY29tcG9uZW50QXR0cmlidXRlcyk7XG5cbiAgICBsZXQgdGVtcGxhdGU6IHN0cmluZyA9IGJpbmRpbmdzLnRlbXBsYXRlID8/IGFnQ2hhcnRUYWc7XG4gICAgT2JqZWN0LnZhbHVlcyhiaW5kaW5ncy5wbGFjZWhvbGRlcnMpLmZvckVhY2goKHBsYWNlaG9sZGVyOiBzdHJpbmcpID0+IHtcbiAgICAgICAgdGVtcGxhdGUgPSB0ZW1wbGF0ZS5yZXBsYWNlKHBsYWNlaG9sZGVyLCBhZ0NoYXJ0VGFnKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBjb252ZXJ0RnVuY3Rpb25hbFRlbXBsYXRlKHRlbXBsYXRlKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q29tcG9uZW50TWV0YWRhdGEoYmluZGluZ3M6IGFueSwgcHJvcGVydHk6IGFueSkge1xuICAgIGNvbnN0IHtcbiAgICAgICAgb3B0aW9uc1R5cGVJbmZvLFxuICAgICAgICBjaGFydFNldHRpbmdzOiB7IGVudGVycHJpc2UgPSBmYWxzZSB9LFxuICAgIH0gPSBiaW5kaW5ncztcblxuICAgIGNvbnN0IHN0YXRlUHJvcGVydGllcyA9IFtdO1xuICAgIGNvbnN0IGNvbXBvbmVudEF0dHJpYnV0ZXMgPSBbXTtcblxuICAgIGNvbnN0IGNoYXJ0T3B0aW9uc1R5cGUgPSBvcHRpb25zVHlwZUluZm8/LnR5cGVTdHIgPz8gJ0FnQ2hhcnRPcHRpb25zJztcblxuICAgIHN0YXRlUHJvcGVydGllcy5wdXNoKFxuICAgICAgICBgY29uc3QgWyR7cHJvcGVydHkubmFtZX0sIHNldCR7dG9UaXRsZUNhc2UocHJvcGVydHkubmFtZSl9XSA9IHVzZVN0YXRlPCR7Y2hhcnRPcHRpb25zVHlwZX0+KCR7cHJvcGVydHkudmFsdWV9KTtgXG4gICAgKTtcblxuICAgIGlmIChlbnRlcnByaXNlKSB7XG4gICAgICAgIC8vIEB0b2RvKEFHLTg0OTIpOiBUZW1wb3Jhcnkgd29ya2Fyb3VuZCBmb3IgdHlwaW5ncyBtaXNtYXRjaC5cbiAgICAgICAgY29tcG9uZW50QXR0cmlidXRlcy5wdXNoKGBvcHRpb25zPXske3Byb3BlcnR5Lm5hbWV9IGFzIGFueX1gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb21wb25lbnRBdHRyaWJ1dGVzLnB1c2goYG9wdGlvbnM9eyR7cHJvcGVydHkubmFtZX19YCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdGVQcm9wZXJ0aWVzLFxuICAgICAgICBjb21wb25lbnRBdHRyaWJ1dGVzLFxuICAgIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2YW5pbGxhVG9SZWFjdEZ1bmN0aW9uYWxUcyhiaW5kaW5nczogYW55LCBjb21wb25lbnRGaWxlbmFtZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCB7IHByb3BlcnRpZXMgfSA9IGJpbmRpbmdzO1xuICAgIGNvbnN0IGltcG9ydHMgPSBnZXRJbXBvcnRzKGNvbXBvbmVudEZpbGVuYW1lcywgYmluZGluZ3MpO1xuICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IE9iamVjdC5rZXlzKGJpbmRpbmdzLnBsYWNlaG9sZGVycyk7XG5cbiAgICBsZXQgaW5kZXhGaWxlOiBzdHJpbmc7XG5cbiAgICBpZiAocGxhY2Vob2xkZXJzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgIGNvbnN0IHsgc3RhdGVQcm9wZXJ0aWVzLCBjb21wb25lbnRBdHRyaWJ1dGVzIH0gPSBnZXRDb21wb25lbnRNZXRhZGF0YShcbiAgICAgICAgICAgIGJpbmRpbmdzLFxuICAgICAgICAgICAgcHJvcGVydGllcy5maW5kKChwKSA9PiBwLm5hbWUgPT09ICdvcHRpb25zJylcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IGdldFRlbXBsYXRlKGJpbmRpbmdzLCBjb21wb25lbnRBdHRyaWJ1dGVzKTtcblxuICAgICAgICBjb25zdCBleHRlcm5hbEV2ZW50SGFuZGxlcnMgPSBiaW5kaW5ncy5leHRlcm5hbEV2ZW50SGFuZGxlcnMubWFwKChoYW5kbGVyKSA9PlxuICAgICAgICAgICAgcHJvY2Vzc0Z1bmN0aW9uKGNvbnZlcnRGdW5jdGlvblRvQ29uc3RDYWxsYmFjayhoYW5kbGVyLmJvZHksIGJpbmRpbmdzLmNhbGxiYWNrRGVwZW5kZW5jaWVzKSlcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgaW5zdGFuY2VNZXRob2RzID0gYmluZGluZ3MuaW5zdGFuY2VNZXRob2RzLm1hcCgobSkgPT5cbiAgICAgICAgICAgIHByb2Nlc3NGdW5jdGlvbihjb252ZXJ0RnVuY3Rpb25Ub0NvbnN0Q2FsbGJhY2sobSwgYmluZGluZ3MuY2FsbGJhY2tEZXBlbmRlbmNpZXMpKVxuICAgICAgICApO1xuXG4gICAgICAgIGluZGV4RmlsZSA9IGBcbiAgICAgICAgICAgICR7aW1wb3J0cy5qb2luKGBcbiAgICAgICAgICAgIGApfVxuXG4gICAgICAgICAgICAke2JpbmRpbmdzLmdsb2JhbHMuam9pbihgXG4gICAgICAgICAgICBgKX1cblxuICAgICAgICAgICAgY29uc3QgQ2hhcnRFeGFtcGxlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICR7YmluZGluZ3MudXNlc0NoYXJ0QXBpID8gYGNvbnN0IGNoYXJ0UmVmID0gdXNlUmVmPEFnQ2hhcnRzUmVhY3Q+KG51bGwpO2AgOiAnJ31cbiAgICAgICAgICAgICAgICAke3N0YXRlUHJvcGVydGllcy5qb2luKCcsXFxuICAgICAgICAgICAgJyl9XG5cbiAgICAgICAgICAgICAgICAke2luc3RhbmNlTWV0aG9kcy5jb25jYXQoZXh0ZXJuYWxFdmVudEhhbmRsZXJzKS5qb2luKCdcXG5cXG4gICAgJyl9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gJHt0ZW1wbGF0ZX07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBjcmVhdGVSb290KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb290JykhKTtcbiAgICAgICAgICAgIHJvb3QucmVuZGVyKDxDaGFydEV4YW1wbGUgLz4pO1xuICAgICAgICAgICAgYDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjb21wb25lbnRzID0gW107XG4gICAgICAgIGluZGV4RmlsZSA9IGBcbiAgICAgICAgICAgICR7aW1wb3J0cy5qb2luKGBcbiAgICAgICAgICAgIGApfVxuXG4gICAgICAgICAgICAke2JpbmRpbmdzLmdsb2JhbHMuam9pbihgXG4gICAgICAgICAgICBgKX1cbiAgICAgICAgYDtcblxuICAgICAgICBwbGFjZWhvbGRlcnMuZm9yRWFjaCgoaWQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudE5hbWUgPSB0b1RpdGxlQ2FzZShpZCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IGJpbmRpbmdzLmNoYXJ0UHJvcGVydGllc1tpZF07XG4gICAgICAgICAgICBjb25zdCB7IHN0YXRlUHJvcGVydGllcywgY29tcG9uZW50QXR0cmlidXRlcyB9ID0gZ2V0Q29tcG9uZW50TWV0YWRhdGEoXG4gICAgICAgICAgICAgICAgYmluZGluZ3MsXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcy5maW5kKChwKSA9PiBwLm5hbWUgPT09IHByb3BlcnR5TmFtZSlcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIE9iamVjdC5lbnRyaWVzKGJpbmRpbmdzLmNoYXJ0QXR0cmlidXRlc1tpZF0pLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChrZXkgPT09ICdzdHlsZScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50QXR0cmlidXRlcy5wdXNoKGBjb250YWluZXJTdHlsZT17JHtKU09OLnN0cmluZ2lmeShzdHlsZUFzT2JqZWN0KHZhbHVlIGFzIGFueSkpfX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gY2hhcnQgYXR0cmlidXRlOiAke2tleX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaW5kZXhGaWxlID0gYCR7aW5kZXhGaWxlfVxuXG4gICAgICAgICAgICBjb25zdCAke2NvbXBvbmVudE5hbWV9ID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICR7c3RhdGVQcm9wZXJ0aWVzLmpvaW4oYDtcbiAgICAgICAgICAgICAgICBgKX1cblxuICAgICAgICAgICAgICAgIHJldHVybiAke2dldEFnQ2hhcnRUYWcoYmluZGluZ3MsIGNvbXBvbmVudEF0dHJpYnV0ZXMpfTtcbiAgICAgICAgICAgIH1gO1xuXG4gICAgICAgICAgICBjb21wb25lbnRzLnB1c2goYDwke2NvbXBvbmVudE5hbWV9IC8+YCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGluZGV4RmlsZSA9IGAke2luZGV4RmlsZX1cblxuICAgICAgICBjb25zdCByb290ID0gY3JlYXRlUm9vdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9vdCcpISk7XG4gICAgICAgIHJvb3QucmVuZGVyKFxuICAgICAgICAgICAgPEZyYWdtZW50PlxuICAgICAgICAgICAgICAgICR7Y29tcG9uZW50cy5qb2luKGBcbiAgICAgICAgICAgICAgICBgKX1cbiAgICAgICAgICAgIDwvRnJhZ21lbnQ+XG4gICAgICAgICk7XG4gICAgICAgIGA7XG4gICAgfVxuXG4gICAgaWYgKGJpbmRpbmdzLnVzZXNDaGFydEFwaSkge1xuICAgICAgICBpbmRleEZpbGUgPSBpbmRleEZpbGUucmVwbGFjZSgvQWdDaGFydHMuKFxcdyopXFwoKFxcdyopKCx8XFwpKS9nLCAnQWdDaGFydHMuJDEoY2hhcnRSZWYuY3VycmVudCEuY2hhcnQkMycpO1xuICAgICAgICBpbmRleEZpbGUgPSBpbmRleEZpbGUucmVwbGFjZSgvXFwodGhpcy5jaGFydFJlZi5jdXJyZW50LmNoYXJ0LCBvcHRpb25zL2csICcoY2hhcnRSZWYuY3VycmVudCEuY2hhcnQsIG9wdGlvbnMnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW5kZXhGaWxlO1xufVxuIl0sIm5hbWVzIjpbInByb2Nlc3NGdW5jdGlvbiIsInZhbmlsbGFUb1JlYWN0RnVuY3Rpb25hbFRzIiwiY29kZSIsIndyYXBPcHRpb25zVXBkYXRlQ29kZSIsImNvbnZlcnRGdW5jdGlvblRvUHJvcGVydHkiLCJnZXRJbXBvcnRzIiwiY29tcG9uZW50RmlsZW5hbWVzIiwiYmluZGluZ3MiLCJ1c2VDYWxsYmFjayIsImV4dGVybmFsRXZlbnRIYW5kbGVycyIsImxlbmd0aCIsImluc3RhbmNlTWV0aG9kcyIsInJlYWN0SW1wb3J0cyIsInB1c2giLCJ1c2VzQ2hhcnRBcGkiLCJpbXBvcnRzIiwiam9pbiIsImFkZEJpbmRpbmdJbXBvcnRzIiwibWFwIiwiZ2V0SW1wb3J0IiwiZ2V0QWdDaGFydFRhZyIsImNvbXBvbmVudEF0dHJpYnV0ZXMiLCJnZXRUZW1wbGF0ZSIsImFnQ2hhcnRUYWciLCJ0ZW1wbGF0ZSIsIk9iamVjdCIsInZhbHVlcyIsInBsYWNlaG9sZGVycyIsImZvckVhY2giLCJwbGFjZWhvbGRlciIsInJlcGxhY2UiLCJjb252ZXJ0RnVuY3Rpb25hbFRlbXBsYXRlIiwiZ2V0Q29tcG9uZW50TWV0YWRhdGEiLCJwcm9wZXJ0eSIsIm9wdGlvbnNUeXBlSW5mbyIsImNoYXJ0U2V0dGluZ3MiLCJlbnRlcnByaXNlIiwic3RhdGVQcm9wZXJ0aWVzIiwiY2hhcnRPcHRpb25zVHlwZSIsInR5cGVTdHIiLCJuYW1lIiwidG9UaXRsZUNhc2UiLCJ2YWx1ZSIsInByb3BlcnRpZXMiLCJrZXlzIiwiaW5kZXhGaWxlIiwiZmluZCIsInAiLCJoYW5kbGVyIiwiY29udmVydEZ1bmN0aW9uVG9Db25zdENhbGxiYWNrIiwiYm9keSIsImNhbGxiYWNrRGVwZW5kZW5jaWVzIiwibSIsImdsb2JhbHMiLCJjb25jYXQiLCJjb21wb25lbnRzIiwiaWQiLCJjb21wb25lbnROYW1lIiwicHJvcGVydHlOYW1lIiwiY2hhcnRQcm9wZXJ0aWVzIiwiZW50cmllcyIsImNoYXJ0QXR0cmlidXRlcyIsImtleSIsIkpTT04iLCJzdHJpbmdpZnkiLCJzdHlsZUFzT2JqZWN0IiwiRXJyb3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBS2dCQSxlQUFlO2VBQWZBOztJQWlGTUMsMEJBQTBCO2VBQTFCQTs7OzRCQXRGZ0I7NkJBQ3VCOzRCQUN1Qzs2QkFDeEU7QUFFckIsU0FBU0QsZ0JBQWdCRSxJQUFZO0lBQ3hDLE9BQU9DLElBQUFBLGlDQUFxQixFQUN4QkMsSUFBQUEsc0NBQXlCLEVBQUNGLE9BQzFCLCtCQUNBLHNCQUNBO0FBRVI7QUFFQSxTQUFTRyxXQUFXQyxrQkFBNEIsRUFBRUMsUUFBYTtRQUN2Q0EsaUNBQXlDQTtJQUE3RCxNQUFNQyxjQUFjRCxFQUFBQSxrQ0FBQUEsU0FBU0UscUJBQXFCLHFCQUE5QkYsZ0NBQWdDRyxNQUFNLE1BQUdILDRCQUFBQSxTQUFTSSxlQUFlLHFCQUF4QkosMEJBQTBCRyxNQUFNLElBQUc7SUFFaEcsTUFBTUUsZUFBZTtRQUFDO1FBQVk7S0FBVztJQUM3QyxJQUFJSixhQUFhSSxhQUFhQyxJQUFJLENBQUM7SUFDbkMsSUFBSU4sU0FBU08sWUFBWSxFQUFFRixhQUFhQyxJQUFJLENBQUM7SUFFN0MsTUFBTUUsVUFBVTtRQUNaLENBQUMsZ0JBQWdCLEVBQUVILGFBQWFJLElBQUksQ0FBQyxNQUFNLGdCQUFnQixDQUFDO1FBQzVELENBQUMsOENBQThDLENBQUM7S0FDbkQ7SUFFREQsUUFBUUYsSUFBSSxDQUFDLENBQUMsZ0RBQWdELENBQUM7SUFFL0QsSUFBSU4sU0FBU1EsT0FBTyxDQUFDTCxNQUFNLEdBQUcsR0FBRztRQUM3Qk8sSUFBQUEsOEJBQWlCLEVBQUNWLFNBQVNRLE9BQU8sRUFBRUEsU0FBUyxPQUFPO0lBQ3hEO0lBRUEsSUFBSVQsb0JBQW9CO1FBQ3BCUyxRQUFRRixJQUFJLElBQUlQLG1CQUFtQlksR0FBRyxDQUFDQyxxQkFBUztJQUNw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