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
    vanillaToReactFunctional: function() {
        return vanillaToReactFunctional;
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
        `import { createRoot } from 'react-dom/client';`,
        `import { AgChartsReact } from 'ag-charts-react';`
    ];
    const chartImport = (0, _chartutils.getChartImports)(bindings.imports, bindings.usesChartApi);
    if (chartImport) {
        imports.push(chartImport);
    }
    if (componentFilenames) {
        imports.push(...componentFilenames.map(_reactutils.getImport));
    }
    if (bindings.chartSettings.enterprise) {
        imports.push(`import 'ag-charts-enterprise';`);
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
function getComponentMetadata(property) {
    const stateProperties = [];
    const componentAttributes = [];
    stateProperties.push(`const [${property.name}, set${(0, _stringutils.toTitleCase)(property.name)}] = useState(${property.value});`);
    componentAttributes.push(`options={${property.name}}`);
    return {
        stateProperties,
        componentAttributes
    };
}
async function vanillaToReactFunctional(bindings, componentFilenames) {
    const { properties } = bindings;
    const imports = getImports(componentFilenames, bindings);
    const placeholders = Object.keys(bindings.placeholders);
    let indexFile;
    if (placeholders.length <= 1) {
        const { stateProperties, componentAttributes } = getComponentMetadata(properties.find((p)=>p.name === 'options'));
        const template = getTemplate(bindings, componentAttributes);
        const externalEventHandlers = bindings.externalEventHandlers.map((handler)=>processFunction((0, _reactutils.convertFunctionToConstCallback)(handler.body, bindings.callbackDependencies)));
        const instanceMethods = bindings.instanceMethods.map((m)=>processFunction((0, _reactutils.convertFunctionToConstCallback)(m, bindings.callbackDependencies)));
        indexFile = `
            ${imports.join(`
            `)}

            ${bindings.globals.join(`
            `)}

            const ChartExample = () => {
                ${bindings.usesChartApi ? `const chartRef = useRef(null);` : ''}
                ${stateProperties.join(',\n            ')}

                ${instanceMethods.concat(externalEventHandlers).join('\n\n    ')}

                return ${template};
            }

            const root = createRoot(document.getElementById('root'));
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
            const { stateProperties, componentAttributes } = getComponentMetadata(properties.find((p)=>p.name === propertyName));
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

        const root = createRoot(document.getElementById('root'));
        root.render(
            <Fragment>
                ${components.join(`
                `)}
            </Fragment>
        );
        `;
    }
    if (bindings.usesChartApi) {
        indexFile = indexFile.replace(/AgCharts.(\w*)\((\w*)(,|\))/g, 'AgCharts.$1(chartRef.current.chart$3');
        indexFile = indexFile.replace(/\(this.chartRef.current.chart, options/g, '(chartRef.current.chart, options');
    }
    return indexFile;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvY2hhcnQtdmFuaWxsYS10by1yZWFjdC1mdW5jdGlvbmFsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGdldENoYXJ0SW1wb3J0cywgd3JhcE9wdGlvbnNVcGRhdGVDb2RlIH0gZnJvbSAnLi9jaGFydC11dGlscyc7XG5pbXBvcnQgeyBjb252ZXJ0RnVuY3Rpb25Ub1Byb3BlcnR5LCBpc0luc3RhbmNlTWV0aG9kIH0gZnJvbSAnLi9wYXJzZXItdXRpbHMnO1xuaW1wb3J0IHsgY29udmVydEZ1bmN0aW9uVG9Db25zdENhbGxiYWNrLCBjb252ZXJ0RnVuY3Rpb25hbFRlbXBsYXRlLCBnZXRJbXBvcnQsIHN0eWxlQXNPYmplY3QgfSBmcm9tICcuL3JlYWN0LXV0aWxzJztcbmltcG9ydCB7IHRvVGl0bGVDYXNlIH0gZnJvbSAnLi9zdHJpbmctdXRpbHMnO1xuXG5leHBvcnQgZnVuY3Rpb24gcHJvY2Vzc0Z1bmN0aW9uKGNvZGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHdyYXBPcHRpb25zVXBkYXRlQ29kZShcbiAgICAgICAgY29udmVydEZ1bmN0aW9uVG9Qcm9wZXJ0eShjb2RlKSxcbiAgICAgICAgJ2NvbnN0IGNsb25lID0gey4uLm9wdGlvbnN9OycsXG4gICAgICAgICdzZXRPcHRpb25zKGNsb25lKTsnLFxuICAgICAgICAnY2xvbmUnXG4gICAgKTtcbn1cblxuZnVuY3Rpb24gZ2V0SW1wb3J0cyhjb21wb25lbnRGaWxlbmFtZXM6IHN0cmluZ1tdLCBiaW5kaW5ncyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCB1c2VDYWxsYmFjayA9IGJpbmRpbmdzLmV4dGVybmFsRXZlbnRIYW5kbGVycz8ubGVuZ3RoICsgYmluZGluZ3MuaW5zdGFuY2VNZXRob2RzPy5sZW5ndGggPiAwO1xuXG4gICAgY29uc3QgcmVhY3RJbXBvcnRzID0gWydGcmFnbWVudCcsICd1c2VTdGF0ZSddO1xuICAgIGlmICh1c2VDYWxsYmFjaykgcmVhY3RJbXBvcnRzLnB1c2goJ3VzZUNhbGxiYWNrJyk7XG4gICAgaWYgKGJpbmRpbmdzLnVzZXNDaGFydEFwaSkgcmVhY3RJbXBvcnRzLnB1c2goJ3VzZVJlZicpO1xuXG4gICAgY29uc3QgaW1wb3J0cyA9IFtcbiAgICAgICAgYGltcG9ydCBSZWFjdCwgeyAke3JlYWN0SW1wb3J0cy5qb2luKCcsICcpfSB9IGZyb20gJ3JlYWN0JztgLFxuICAgICAgICBgaW1wb3J0IHsgY3JlYXRlUm9vdCB9IGZyb20gJ3JlYWN0LWRvbS9jbGllbnQnO2AsXG4gICAgICAgIGBpbXBvcnQgeyBBZ0NoYXJ0c1JlYWN0IH0gZnJvbSAnYWctY2hhcnRzLXJlYWN0JztgLFxuICAgIF07XG5cbiAgICBjb25zdCBjaGFydEltcG9ydCA9IGdldENoYXJ0SW1wb3J0cyhiaW5kaW5ncy5pbXBvcnRzLCBiaW5kaW5ncy51c2VzQ2hhcnRBcGkpO1xuICAgIGlmIChjaGFydEltcG9ydCkge1xuICAgICAgICBpbXBvcnRzLnB1c2goY2hhcnRJbXBvcnQpO1xuICAgIH1cblxuICAgIGlmIChjb21wb25lbnRGaWxlbmFtZXMpIHtcbiAgICAgICAgaW1wb3J0cy5wdXNoKC4uLmNvbXBvbmVudEZpbGVuYW1lcy5tYXAoZ2V0SW1wb3J0KSk7XG4gICAgfVxuXG4gICAgaWYgKGJpbmRpbmdzLmNoYXJ0U2V0dGluZ3MuZW50ZXJwcmlzZSkge1xuICAgICAgICBpbXBvcnRzLnB1c2goYGltcG9ydCAnYWctY2hhcnRzLWVudGVycHJpc2UnO2ApO1xuICAgIH1cblxuICAgIHJldHVybiBpbXBvcnRzO1xufVxuXG5mdW5jdGlvbiBnZXRBZ0NoYXJ0VGFnKGJpbmRpbmdzOiBhbnksIGNvbXBvbmVudEF0dHJpYnV0ZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYDxBZ0NoYXJ0c1JlYWN0XG4gICAgICAgICR7YmluZGluZ3MudXNlc0NoYXJ0QXBpID8gJ3JlZj17Y2hhcnRSZWZ9JyA6ICcnfVxuICAgICAgICAke2NvbXBvbmVudEF0dHJpYnV0ZXMuam9pbihgXG4gICAgICAgIGApfVxuICAgIC8+YDtcbn1cblxuZnVuY3Rpb24gZ2V0VGVtcGxhdGUoYmluZGluZ3M6IGFueSwgY29tcG9uZW50QXR0cmlidXRlczogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIGNvbnN0IGFnQ2hhcnRUYWcgPSBnZXRBZ0NoYXJ0VGFnKGJpbmRpbmdzLCBjb21wb25lbnRBdHRyaWJ1dGVzKTtcblxuICAgIGxldCB0ZW1wbGF0ZTogc3RyaW5nID0gYmluZGluZ3MudGVtcGxhdGUgPz8gYWdDaGFydFRhZztcbiAgICBPYmplY3QudmFsdWVzKGJpbmRpbmdzLnBsYWNlaG9sZGVycykuZm9yRWFjaCgocGxhY2Vob2xkZXI6IHN0cmluZykgPT4ge1xuICAgICAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlLnJlcGxhY2UocGxhY2Vob2xkZXIsIGFnQ2hhcnRUYWcpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNvbnZlcnRGdW5jdGlvbmFsVGVtcGxhdGUodGVtcGxhdGUpO1xufVxuXG5mdW5jdGlvbiBnZXRDb21wb25lbnRNZXRhZGF0YShwcm9wZXJ0eTogYW55KSB7XG4gICAgY29uc3Qgc3RhdGVQcm9wZXJ0aWVzID0gW107XG4gICAgY29uc3QgY29tcG9uZW50QXR0cmlidXRlcyA9IFtdO1xuXG4gICAgc3RhdGVQcm9wZXJ0aWVzLnB1c2goYGNvbnN0IFske3Byb3BlcnR5Lm5hbWV9LCBzZXQke3RvVGl0bGVDYXNlKHByb3BlcnR5Lm5hbWUpfV0gPSB1c2VTdGF0ZSgke3Byb3BlcnR5LnZhbHVlfSk7YCk7XG4gICAgY29tcG9uZW50QXR0cmlidXRlcy5wdXNoKGBvcHRpb25zPXske3Byb3BlcnR5Lm5hbWV9fWApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdGVQcm9wZXJ0aWVzLFxuICAgICAgICBjb21wb25lbnRBdHRyaWJ1dGVzLFxuICAgIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2YW5pbGxhVG9SZWFjdEZ1bmN0aW9uYWwoYmluZGluZ3M6IGFueSwgY29tcG9uZW50RmlsZW5hbWVzOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgeyBwcm9wZXJ0aWVzIH0gPSBiaW5kaW5ncztcbiAgICBjb25zdCBpbXBvcnRzID0gZ2V0SW1wb3J0cyhjb21wb25lbnRGaWxlbmFtZXMsIGJpbmRpbmdzKTtcbiAgICBjb25zdCBwbGFjZWhvbGRlcnMgPSBPYmplY3Qua2V5cyhiaW5kaW5ncy5wbGFjZWhvbGRlcnMpO1xuXG4gICAgbGV0IGluZGV4RmlsZTogc3RyaW5nO1xuXG4gICAgaWYgKHBsYWNlaG9sZGVycy5sZW5ndGggPD0gMSkge1xuICAgICAgICBjb25zdCB7IHN0YXRlUHJvcGVydGllcywgY29tcG9uZW50QXR0cmlidXRlcyB9ID0gZ2V0Q29tcG9uZW50TWV0YWRhdGEoXG4gICAgICAgICAgICBwcm9wZXJ0aWVzLmZpbmQoKHApID0+IHAubmFtZSA9PT0gJ29wdGlvbnMnKVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZ2V0VGVtcGxhdGUoYmluZGluZ3MsIGNvbXBvbmVudEF0dHJpYnV0ZXMpO1xuXG4gICAgICAgIGNvbnN0IGV4dGVybmFsRXZlbnRIYW5kbGVycyA9IGJpbmRpbmdzLmV4dGVybmFsRXZlbnRIYW5kbGVycy5tYXAoKGhhbmRsZXIpID0+XG4gICAgICAgICAgICBwcm9jZXNzRnVuY3Rpb24oY29udmVydEZ1bmN0aW9uVG9Db25zdENhbGxiYWNrKGhhbmRsZXIuYm9keSwgYmluZGluZ3MuY2FsbGJhY2tEZXBlbmRlbmNpZXMpKVxuICAgICAgICApO1xuICAgICAgICBjb25zdCBpbnN0YW5jZU1ldGhvZHMgPSBiaW5kaW5ncy5pbnN0YW5jZU1ldGhvZHMubWFwKChtKSA9PlxuICAgICAgICAgICAgcHJvY2Vzc0Z1bmN0aW9uKGNvbnZlcnRGdW5jdGlvblRvQ29uc3RDYWxsYmFjayhtLCBiaW5kaW5ncy5jYWxsYmFja0RlcGVuZGVuY2llcykpXG4gICAgICAgICk7XG5cbiAgICAgICAgaW5kZXhGaWxlID0gYFxuICAgICAgICAgICAgJHtpbXBvcnRzLmpvaW4oYFxuICAgICAgICAgICAgYCl9XG5cbiAgICAgICAgICAgICR7YmluZGluZ3MuZ2xvYmFscy5qb2luKGBcbiAgICAgICAgICAgIGApfVxuXG4gICAgICAgICAgICBjb25zdCBDaGFydEV4YW1wbGUgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgJHtiaW5kaW5ncy51c2VzQ2hhcnRBcGkgPyBgY29uc3QgY2hhcnRSZWYgPSB1c2VSZWYobnVsbCk7YCA6ICcnfVxuICAgICAgICAgICAgICAgICR7c3RhdGVQcm9wZXJ0aWVzLmpvaW4oJyxcXG4gICAgICAgICAgICAnKX1cblxuICAgICAgICAgICAgICAgICR7aW5zdGFuY2VNZXRob2RzLmNvbmNhdChleHRlcm5hbEV2ZW50SGFuZGxlcnMpLmpvaW4oJ1xcblxcbiAgICAnKX1cblxuICAgICAgICAgICAgICAgIHJldHVybiAke3RlbXBsYXRlfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgcm9vdCA9IGNyZWF0ZVJvb3QoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jvb3QnKSk7XG4gICAgICAgICAgICByb290LnJlbmRlcig8Q2hhcnRFeGFtcGxlIC8+KTtcbiAgICAgICAgICAgIGA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY29tcG9uZW50czogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgaW5kZXhGaWxlID0gYFxuICAgICAgICAgICAgJHtpbXBvcnRzLmpvaW4oYFxuICAgICAgICAgICAgYCl9XG5cbiAgICAgICAgICAgICR7YmluZGluZ3MuZ2xvYmFscy5qb2luKGBcbiAgICAgICAgICAgIGApfVxuICAgICAgICBgO1xuXG4gICAgICAgIHBsYWNlaG9sZGVycy5mb3JFYWNoKChpZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50TmFtZSA9IHRvVGl0bGVDYXNlKGlkKTtcblxuICAgICAgICAgICAgY29uc3QgcHJvcGVydHlOYW1lID0gYmluZGluZ3MuY2hhcnRQcm9wZXJ0aWVzW2lkXTtcbiAgICAgICAgICAgIGNvbnN0IHsgc3RhdGVQcm9wZXJ0aWVzLCBjb21wb25lbnRBdHRyaWJ1dGVzIH0gPSBnZXRDb21wb25lbnRNZXRhZGF0YShcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzLmZpbmQoKHApID0+IHAubmFtZSA9PT0gcHJvcGVydHlOYW1lKVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgT2JqZWN0LmVudHJpZXMoYmluZGluZ3MuY2hhcnRBdHRyaWJ1dGVzW2lkXSkuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ3N0eWxlJykge1xuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRBdHRyaWJ1dGVzLnB1c2goYGNvbnRhaW5lclN0eWxlPXske0pTT04uc3RyaW5naWZ5KHN0eWxlQXNPYmplY3QodmFsdWUgYXMgYW55KSl9fWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBjaGFydCBhdHRyaWJ1dGU6ICR7a2V5fWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpbmRleEZpbGUgPSBgJHtpbmRleEZpbGV9XG5cbiAgICAgICAgICAgIGNvbnN0ICR7Y29tcG9uZW50TmFtZX0gPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgJHtzdGF0ZVByb3BlcnRpZXMuam9pbihgO1xuICAgICAgICAgICAgICAgIGApfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuICR7Z2V0QWdDaGFydFRhZyhiaW5kaW5ncywgY29tcG9uZW50QXR0cmlidXRlcyl9O1xuICAgICAgICAgICAgfWA7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudHMucHVzaChgPCR7Y29tcG9uZW50TmFtZX0gLz5gKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaW5kZXhGaWxlID0gYCR7aW5kZXhGaWxlfVxuXG4gICAgICAgIGNvbnN0IHJvb3QgPSBjcmVhdGVSb290KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb290JykpO1xuICAgICAgICByb290LnJlbmRlcihcbiAgICAgICAgICAgIDxGcmFnbWVudD5cbiAgICAgICAgICAgICAgICAke2NvbXBvbmVudHMuam9pbihgXG4gICAgICAgICAgICAgICAgYCl9XG4gICAgICAgICAgICA8L0ZyYWdtZW50PlxuICAgICAgICApO1xuICAgICAgICBgO1xuICAgIH1cblxuICAgIGlmIChiaW5kaW5ncy51c2VzQ2hhcnRBcGkpIHtcbiAgICAgICAgaW5kZXhGaWxlID0gaW5kZXhGaWxlLnJlcGxhY2UoL0FnQ2hhcnRzLihcXHcqKVxcKChcXHcqKSgsfFxcKSkvZywgJ0FnQ2hhcnRzLiQxKGNoYXJ0UmVmLmN1cnJlbnQuY2hhcnQkMycpO1xuICAgICAgICBpbmRleEZpbGUgPSBpbmRleEZpbGUucmVwbGFjZSgvXFwodGhpcy5jaGFydFJlZi5jdXJyZW50LmNoYXJ0LCBvcHRpb25zL2csICcoY2hhcnRSZWYuY3VycmVudC5jaGFydCwgb3B0aW9ucycpO1xuICAgIH1cblxuICAgIHJldHVybiBpbmRleEZpbGU7XG59XG4iXSwibmFtZXMiOlsicHJvY2Vzc0Z1bmN0aW9uIiwidmFuaWxsYVRvUmVhY3RGdW5jdGlvbmFsIiwiY29kZSIsIndyYXBPcHRpb25zVXBkYXRlQ29kZSIsImNvbnZlcnRGdW5jdGlvblRvUHJvcGVydHkiLCJnZXRJbXBvcnRzIiwiY29tcG9uZW50RmlsZW5hbWVzIiwiYmluZGluZ3MiLCJ1c2VDYWxsYmFjayIsImV4dGVybmFsRXZlbnRIYW5kbGVycyIsImxlbmd0aCIsImluc3RhbmNlTWV0aG9kcyIsInJlYWN0SW1wb3J0cyIsInB1c2giLCJ1c2VzQ2hhcnRBcGkiLCJpbXBvcnRzIiwiam9pbiIsImNoYXJ0SW1wb3J0IiwiZ2V0Q2hhcnRJbXBvcnRzIiwibWFwIiwiZ2V0SW1wb3J0IiwiY2hhcnRTZXR0aW5ncyIsImVudGVycHJpc2UiLCJnZXRBZ0NoYXJ0VGFnIiwiY29tcG9uZW50QXR0cmlidXRlcyIsImdldFRlbXBsYXRlIiwiYWdDaGFydFRhZyIsInRlbXBsYXRlIiwiT2JqZWN0IiwidmFsdWVzIiwicGxhY2Vob2xkZXJzIiwiZm9yRWFjaCIsInBsYWNlaG9sZGVyIiwicmVwbGFjZSIsImNvbnZlcnRGdW5jdGlvbmFsVGVtcGxhdGUiLCJnZXRDb21wb25lbnRNZXRhZGF0YSIsInByb3BlcnR5Iiwic3RhdGVQcm9wZXJ0aWVzIiwibmFtZSIsInRvVGl0bGVDYXNlIiwidmFsdWUiLCJwcm9wZXJ0aWVzIiwia2V5cyIsImluZGV4RmlsZSIsImZpbmQiLCJwIiwiaGFuZGxlciIsImNvbnZlcnRGdW5jdGlvblRvQ29uc3RDYWxsYmFjayIsImJvZHkiLCJjYWxsYmFja0RlcGVuZGVuY2llcyIsIm0iLCJnbG9iYWxzIiwiY29uY2F0IiwiY29tcG9uZW50cyIsImlkIiwiY29tcG9uZW50TmFtZSIsInByb3BlcnR5TmFtZSIsImNoYXJ0UHJvcGVydGllcyIsImVudHJpZXMiLCJjaGFydEF0dHJpYnV0ZXMiLCJrZXkiLCJKU09OIiwic3RyaW5naWZ5Iiwic3R5bGVBc09iamVjdCIsIkVycm9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQUtnQkEsZUFBZTtlQUFmQTs7SUFzRU1DLHdCQUF3QjtlQUF4QkE7Ozs0QkEzRWlDOzZCQUNLOzRCQUN3Qzs2QkFDeEU7QUFFckIsU0FBU0QsZ0JBQWdCRSxJQUFZO0lBQ3hDLE9BQU9DLElBQUFBLGlDQUFxQixFQUN4QkMsSUFBQUEsc0NBQXlCLEVBQUNGLE9BQzFCLCtCQUNBLHNCQUNBO0FBRVI7QUFFQSxTQUFTRyxXQUFXQyxrQkFBNEIsRUFBRUMsUUFBUTtRQUNsQ0EsaUNBQXlDQTtJQUE3RCxNQUFNQyxjQUFjRCxFQUFBQSxrQ0FB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