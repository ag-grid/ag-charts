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
    if (bindings.chartSettings.enterprise) {
        imports.push(`import 'ag-charts-enterprise';`);
    }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9leGVjdXRvcnMvZ2VuZXJhdGUvZ2VuZXJhdG9yL3RyYW5zZm9ybWF0aW9uLXNjcmlwdHMvY2hhcnQtdmFuaWxsYS10by1yZWFjdC1mdW5jdGlvbmFsLXRzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHdyYXBPcHRpb25zVXBkYXRlQ29kZSB9IGZyb20gJy4vY2hhcnQtdXRpbHMnO1xuaW1wb3J0IHsgYWRkQmluZGluZ0ltcG9ydHMsIGNvbnZlcnRGdW5jdGlvblRvUHJvcGVydHkgfSBmcm9tICcuL3BhcnNlci11dGlscyc7XG5pbXBvcnQgeyBjb252ZXJ0RnVuY3Rpb25Ub0NvbnN0Q2FsbGJhY2ssIGNvbnZlcnRGdW5jdGlvbmFsVGVtcGxhdGUsIGdldEltcG9ydCwgc3R5bGVBc09iamVjdCB9IGZyb20gJy4vcmVhY3QtdXRpbHMnO1xuaW1wb3J0IHsgdG9UaXRsZUNhc2UgfSBmcm9tICcuL3N0cmluZy11dGlscyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9jZXNzRnVuY3Rpb24oY29kZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gd3JhcE9wdGlvbnNVcGRhdGVDb2RlKFxuICAgICAgICBjb252ZXJ0RnVuY3Rpb25Ub1Byb3BlcnR5KGNvZGUpLFxuICAgICAgICAnY29uc3QgY2xvbmUgPSB7Li4ub3B0aW9uc307JyxcbiAgICAgICAgJ3NldE9wdGlvbnMoY2xvbmUpOycsXG4gICAgICAgICdjbG9uZSdcbiAgICApO1xufVxuXG5mdW5jdGlvbiBnZXRJbXBvcnRzKGNvbXBvbmVudEZpbGVuYW1lczogc3RyaW5nW10sIGJpbmRpbmdzKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHVzZUNhbGxiYWNrID0gYmluZGluZ3MuZXh0ZXJuYWxFdmVudEhhbmRsZXJzPy5sZW5ndGggKyBiaW5kaW5ncy5pbnN0YW5jZU1ldGhvZHM/Lmxlbmd0aCA+IDA7XG5cbiAgICBjb25zdCByZWFjdEltcG9ydHMgPSBbJ0ZyYWdtZW50JywgJ3VzZVN0YXRlJ107XG4gICAgaWYgKHVzZUNhbGxiYWNrKSByZWFjdEltcG9ydHMucHVzaCgndXNlQ2FsbGJhY2snKTtcbiAgICBpZiAoYmluZGluZ3MudXNlc0NoYXJ0QXBpKSByZWFjdEltcG9ydHMucHVzaCgndXNlUmVmJyk7XG5cbiAgICBjb25zdCBpbXBvcnRzID0gW1xuICAgICAgICBgaW1wb3J0IFJlYWN0LCB7ICR7cmVhY3RJbXBvcnRzLmpvaW4oJywgJyl9IH0gZnJvbSAncmVhY3QnO2AsXG4gICAgICAgIGBpbXBvcnQgeyBjcmVhdGVSb290IH0gZnJvbSAncmVhY3QtZG9tL2NsaWVudCc7YCxcbiAgICBdO1xuXG4gICAgaWYgKGJpbmRpbmdzLmNoYXJ0U2V0dGluZ3MuZW50ZXJwcmlzZSkge1xuICAgICAgICBpbXBvcnRzLnB1c2goYGltcG9ydCAnYWctY2hhcnRzLWVudGVycHJpc2UnO2ApO1xuICAgIH1cblxuICAgIGltcG9ydHMucHVzaChgaW1wb3J0IHsgQWdDaGFydHNSZWFjdCB9IGZyb20gJ2FnLWNoYXJ0cy1yZWFjdCc7YCk7XG5cbiAgICBpZiAoYmluZGluZ3MuaW1wb3J0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGFkZEJpbmRpbmdJbXBvcnRzKGJpbmRpbmdzLmltcG9ydHMsIGltcG9ydHMsIGZhbHNlLCB0cnVlKTtcbiAgICB9XG5cbiAgICBpZiAoY29tcG9uZW50RmlsZW5hbWVzKSB7XG4gICAgICAgIGltcG9ydHMucHVzaCguLi5jb21wb25lbnRGaWxlbmFtZXMubWFwKGdldEltcG9ydCkpO1xuICAgIH1cblxuICAgIHJldHVybiBpbXBvcnRzO1xufVxuXG5mdW5jdGlvbiBnZXRBZ0NoYXJ0VGFnKGJpbmRpbmdzOiBhbnksIGNvbXBvbmVudEF0dHJpYnV0ZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYDxBZ0NoYXJ0c1JlYWN0XG4gICAgICAgICR7YmluZGluZ3MudXNlc0NoYXJ0QXBpID8gJ3JlZj17Y2hhcnRSZWZ9JyA6ICcnfVxuICAgICAgICAke2NvbXBvbmVudEF0dHJpYnV0ZXMuam9pbihgXG4gICAgICAgIGApfVxuICAgIC8+YDtcbn1cblxuZnVuY3Rpb24gZ2V0VGVtcGxhdGUoYmluZGluZ3M6IGFueSwgY29tcG9uZW50QXR0cmlidXRlczogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIGNvbnN0IGFnQ2hhcnRUYWcgPSBnZXRBZ0NoYXJ0VGFnKGJpbmRpbmdzLCBjb21wb25lbnRBdHRyaWJ1dGVzKTtcblxuICAgIGxldCB0ZW1wbGF0ZTogc3RyaW5nID0gYmluZGluZ3MudGVtcGxhdGUgPz8gYWdDaGFydFRhZztcbiAgICBPYmplY3QudmFsdWVzKGJpbmRpbmdzLnBsYWNlaG9sZGVycykuZm9yRWFjaCgocGxhY2Vob2xkZXI6IHN0cmluZykgPT4ge1xuICAgICAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlLnJlcGxhY2UocGxhY2Vob2xkZXIsIGFnQ2hhcnRUYWcpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNvbnZlcnRGdW5jdGlvbmFsVGVtcGxhdGUodGVtcGxhdGUpO1xufVxuXG5mdW5jdGlvbiBnZXRDb21wb25lbnRNZXRhZGF0YShiaW5kaW5nczogYW55LCBwcm9wZXJ0eTogYW55KSB7XG4gICAgY29uc3Qge1xuICAgICAgICBvcHRpb25zVHlwZUluZm8sXG4gICAgICAgIGNoYXJ0U2V0dGluZ3M6IHsgZW50ZXJwcmlzZSA9IGZhbHNlIH0sXG4gICAgfSA9IGJpbmRpbmdzO1xuXG4gICAgY29uc3Qgc3RhdGVQcm9wZXJ0aWVzID0gW107XG4gICAgY29uc3QgY29tcG9uZW50QXR0cmlidXRlcyA9IFtdO1xuXG4gICAgY29uc3QgY2hhcnRPcHRpb25zVHlwZSA9IG9wdGlvbnNUeXBlSW5mbz8udHlwZVN0ciA/PyAnQWdDaGFydE9wdGlvbnMnO1xuXG4gICAgc3RhdGVQcm9wZXJ0aWVzLnB1c2goXG4gICAgICAgIGBjb25zdCBbJHtwcm9wZXJ0eS5uYW1lfSwgc2V0JHt0b1RpdGxlQ2FzZShwcm9wZXJ0eS5uYW1lKX1dID0gdXNlU3RhdGU8JHtjaGFydE9wdGlvbnNUeXBlfT4oJHtwcm9wZXJ0eS52YWx1ZX0pO2BcbiAgICApO1xuXG4gICAgaWYgKGVudGVycHJpc2UpIHtcbiAgICAgICAgLy8gQHRvZG8oQUctODQ5Mik6IFRlbXBvcmFyeSB3b3JrYXJvdW5kIGZvciB0eXBpbmdzIG1pc21hdGNoLlxuICAgICAgICBjb21wb25lbnRBdHRyaWJ1dGVzLnB1c2goYG9wdGlvbnM9eyR7cHJvcGVydHkubmFtZX0gYXMgYW55fWApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbXBvbmVudEF0dHJpYnV0ZXMucHVzaChgb3B0aW9ucz17JHtwcm9wZXJ0eS5uYW1lfX1gKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBzdGF0ZVByb3BlcnRpZXMsXG4gICAgICAgIGNvbXBvbmVudEF0dHJpYnV0ZXMsXG4gICAgfTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZhbmlsbGFUb1JlYWN0RnVuY3Rpb25hbFRzKGJpbmRpbmdzOiBhbnksIGNvbXBvbmVudEZpbGVuYW1lczogc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHsgcHJvcGVydGllcyB9ID0gYmluZGluZ3M7XG4gICAgY29uc3QgaW1wb3J0cyA9IGdldEltcG9ydHMoY29tcG9uZW50RmlsZW5hbWVzLCBiaW5kaW5ncyk7XG4gICAgY29uc3QgcGxhY2Vob2xkZXJzID0gT2JqZWN0LmtleXMoYmluZGluZ3MucGxhY2Vob2xkZXJzKTtcblxuICAgIGxldCBpbmRleEZpbGU6IHN0cmluZztcblxuICAgIGlmIChwbGFjZWhvbGRlcnMubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgY29uc3QgeyBzdGF0ZVByb3BlcnRpZXMsIGNvbXBvbmVudEF0dHJpYnV0ZXMgfSA9IGdldENvbXBvbmVudE1ldGFkYXRhKFxuICAgICAgICAgICAgYmluZGluZ3MsXG4gICAgICAgICAgICBwcm9wZXJ0aWVzLmZpbmQoKHApID0+IHAubmFtZSA9PT0gJ29wdGlvbnMnKVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZ2V0VGVtcGxhdGUoYmluZGluZ3MsIGNvbXBvbmVudEF0dHJpYnV0ZXMpO1xuXG4gICAgICAgIGNvbnN0IGV4dGVybmFsRXZlbnRIYW5kbGVycyA9IGJpbmRpbmdzLmV4dGVybmFsRXZlbnRIYW5kbGVycy5tYXAoKGhhbmRsZXIpID0+XG4gICAgICAgICAgICBwcm9jZXNzRnVuY3Rpb24oY29udmVydEZ1bmN0aW9uVG9Db25zdENhbGxiYWNrKGhhbmRsZXIuYm9keSwgYmluZGluZ3MuY2FsbGJhY2tEZXBlbmRlbmNpZXMpKVxuICAgICAgICApO1xuICAgICAgICBjb25zdCBpbnN0YW5jZU1ldGhvZHMgPSBiaW5kaW5ncy5pbnN0YW5jZU1ldGhvZHMubWFwKChtKSA9PlxuICAgICAgICAgICAgcHJvY2Vzc0Z1bmN0aW9uKGNvbnZlcnRGdW5jdGlvblRvQ29uc3RDYWxsYmFjayhtLCBiaW5kaW5ncy5jYWxsYmFja0RlcGVuZGVuY2llcykpXG4gICAgICAgICk7XG5cbiAgICAgICAgaW5kZXhGaWxlID0gYFxuICAgICAgICAgICAgJHtpbXBvcnRzLmpvaW4oYFxuICAgICAgICAgICAgYCl9XG5cbiAgICAgICAgICAgICR7YmluZGluZ3MuZ2xvYmFscy5qb2luKGBcbiAgICAgICAgICAgIGApfVxuXG4gICAgICAgICAgICBjb25zdCBDaGFydEV4YW1wbGUgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgJHtiaW5kaW5ncy51c2VzQ2hhcnRBcGkgPyBgY29uc3QgY2hhcnRSZWYgPSB1c2VSZWY8QWdDaGFydHNSZWFjdD4obnVsbCk7YCA6ICcnfVxuICAgICAgICAgICAgICAgICR7c3RhdGVQcm9wZXJ0aWVzLmpvaW4oJyxcXG4gICAgICAgICAgICAnKX1cblxuICAgICAgICAgICAgICAgICR7aW5zdGFuY2VNZXRob2RzLmNvbmNhdChleHRlcm5hbEV2ZW50SGFuZGxlcnMpLmpvaW4oJ1xcblxcbiAgICAnKX1cblxuICAgICAgICAgICAgICAgIHJldHVybiAke3RlbXBsYXRlfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgcm9vdCA9IGNyZWF0ZVJvb3QoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jvb3QnKSEpO1xuICAgICAgICAgICAgcm9vdC5yZW5kZXIoPENoYXJ0RXhhbXBsZSAvPik7XG4gICAgICAgICAgICBgO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBbXTtcbiAgICAgICAgaW5kZXhGaWxlID0gYFxuICAgICAgICAgICAgJHtpbXBvcnRzLmpvaW4oYFxuICAgICAgICAgICAgYCl9XG5cbiAgICAgICAgICAgICR7YmluZGluZ3MuZ2xvYmFscy5qb2luKGBcbiAgICAgICAgICAgIGApfVxuICAgICAgICBgO1xuXG4gICAgICAgIHBsYWNlaG9sZGVycy5mb3JFYWNoKChpZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50TmFtZSA9IHRvVGl0bGVDYXNlKGlkKTtcblxuICAgICAgICAgICAgY29uc3QgcHJvcGVydHlOYW1lID0gYmluZGluZ3MuY2hhcnRQcm9wZXJ0aWVzW2lkXTtcbiAgICAgICAgICAgIGNvbnN0IHsgc3RhdGVQcm9wZXJ0aWVzLCBjb21wb25lbnRBdHRyaWJ1dGVzIH0gPSBnZXRDb21wb25lbnRNZXRhZGF0YShcbiAgICAgICAgICAgICAgICBiaW5kaW5ncyxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzLmZpbmQoKHApID0+IHAubmFtZSA9PT0gcHJvcGVydHlOYW1lKVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgT2JqZWN0LmVudHJpZXMoYmluZGluZ3MuY2hhcnRBdHRyaWJ1dGVzW2lkXSkuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ3N0eWxlJykge1xuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRBdHRyaWJ1dGVzLnB1c2goYGNvbnRhaW5lclN0eWxlPXske0pTT04uc3RyaW5naWZ5KHN0eWxlQXNPYmplY3QodmFsdWUgYXMgYW55KSl9fWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBjaGFydCBhdHRyaWJ1dGU6ICR7a2V5fWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpbmRleEZpbGUgPSBgJHtpbmRleEZpbGV9XG5cbiAgICAgICAgICAgIGNvbnN0ICR7Y29tcG9uZW50TmFtZX0gPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgJHtzdGF0ZVByb3BlcnRpZXMuam9pbihgO1xuICAgICAgICAgICAgICAgIGApfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuICR7Z2V0QWdDaGFydFRhZyhiaW5kaW5ncywgY29tcG9uZW50QXR0cmlidXRlcyl9O1xuICAgICAgICAgICAgfWA7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudHMucHVzaChgPCR7Y29tcG9uZW50TmFtZX0gLz5gKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaW5kZXhGaWxlID0gYCR7aW5kZXhGaWxlfVxuXG4gICAgICAgIGNvbnN0IHJvb3QgPSBjcmVhdGVSb290KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb290JykhKTtcbiAgICAgICAgcm9vdC5yZW5kZXIoXG4gICAgICAgICAgICA8RnJhZ21lbnQ+XG4gICAgICAgICAgICAgICAgJHtjb21wb25lbnRzLmpvaW4oYFxuICAgICAgICAgICAgICAgIGApfVxuICAgICAgICAgICAgPC9GcmFnbWVudD5cbiAgICAgICAgKTtcbiAgICAgICAgYDtcbiAgICB9XG5cbiAgICBpZiAoYmluZGluZ3MudXNlc0NoYXJ0QXBpKSB7XG4gICAgICAgIGluZGV4RmlsZSA9IGluZGV4RmlsZS5yZXBsYWNlKC9BZ0NoYXJ0cy4oXFx3KilcXCgoXFx3KikoLHxcXCkpL2csICdBZ0NoYXJ0cy4kMShjaGFydFJlZi5jdXJyZW50IS5jaGFydCQzJyk7XG4gICAgICAgIGluZGV4RmlsZSA9IGluZGV4RmlsZS5yZXBsYWNlKC9cXCh0aGlzLmNoYXJ0UmVmLmN1cnJlbnQuY2hhcnQsIG9wdGlvbnMvZywgJyhjaGFydFJlZi5jdXJyZW50IS5jaGFydCwgb3B0aW9ucycpO1xuICAgIH1cblxuICAgIHJldHVybiBpbmRleEZpbGU7XG59XG4iXSwibmFtZXMiOlsicHJvY2Vzc0Z1bmN0aW9uIiwidmFuaWxsYVRvUmVhY3RGdW5jdGlvbmFsVHMiLCJjb2RlIiwid3JhcE9wdGlvbnNVcGRhdGVDb2RlIiwiY29udmVydEZ1bmN0aW9uVG9Qcm9wZXJ0eSIsImdldEltcG9ydHMiLCJjb21wb25lbnRGaWxlbmFtZXMiLCJiaW5kaW5ncyIsInVzZUNhbGxiYWNrIiwiZXh0ZXJuYWxFdmVudEhhbmRsZXJzIiwibGVuZ3RoIiwiaW5zdGFuY2VNZXRob2RzIiwicmVhY3RJbXBvcnRzIiwicHVzaCIsInVzZXNDaGFydEFwaSIsImltcG9ydHMiLCJqb2luIiwiY2hhcnRTZXR0aW5ncyIsImVudGVycHJpc2UiLCJhZGRCaW5kaW5nSW1wb3J0cyIsIm1hcCIsImdldEltcG9ydCIsImdldEFnQ2hhcnRUYWciLCJjb21wb25lbnRBdHRyaWJ1dGVzIiwiZ2V0VGVtcGxhdGUiLCJhZ0NoYXJ0VGFnIiwidGVtcGxhdGUiLCJPYmplY3QiLCJ2YWx1ZXMiLCJwbGFjZWhvbGRlcnMiLCJmb3JFYWNoIiwicGxhY2Vob2xkZXIiLCJyZXBsYWNlIiwiY29udmVydEZ1bmN0aW9uYWxUZW1wbGF0ZSIsImdldENvbXBvbmVudE1ldGFkYXRhIiwicHJvcGVydHkiLCJvcHRpb25zVHlwZUluZm8iLCJzdGF0ZVByb3BlcnRpZXMiLCJjaGFydE9wdGlvbnNUeXBlIiwidHlwZVN0ciIsIm5hbWUiLCJ0b1RpdGxlQ2FzZSIsInZhbHVlIiwicHJvcGVydGllcyIsImtleXMiLCJpbmRleEZpbGUiLCJmaW5kIiwicCIsImhhbmRsZXIiLCJjb252ZXJ0RnVuY3Rpb25Ub0NvbnN0Q2FsbGJhY2siLCJib2R5IiwiY2FsbGJhY2tEZXBlbmRlbmNpZXMiLCJtIiwiZ2xvYmFscyIsImNvbmNhdCIsImNvbXBvbmVudHMiLCJpZCIsImNvbXBvbmVudE5hbWUiLCJwcm9wZXJ0eU5hbWUiLCJjaGFydFByb3BlcnRpZXMiLCJlbnRyaWVzIiwiY2hhcnRBdHRyaWJ1dGVzIiwia2V5IiwiSlNPTiIsInN0cmluZ2lmeSIsInN0eWxlQXNPYmplY3QiLCJFcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFLZ0JBLGVBQWU7ZUFBZkE7O0lBcUZNQywwQkFBMEI7ZUFBMUJBOzs7NEJBMUZnQjs2QkFDdUI7NEJBQ3VDOzZCQUN4RTtBQUVyQixTQUFTRCxnQkFBZ0JFLElBQVk7SUFDeEMsT0FBT0MsSUFBQUEsaUNBQXFCLEVBQ3hCQyxJQUFBQSxzQ0FBeUIsRUFBQ0YsT0FDMUIsK0JBQ0Esc0JBQ0E7QUFFUjtBQUVBLFNBQVNHLFdBQVdDLGtCQUE0QixFQUFFQyxRQUFRO1FBQ2xDQSxpQ0FBeUNBO0lBQTdELE1BQU1DLGNBQWNELEVBQUFBLGtDQUFBQSxTQUFTRSxxQkFBcUIscUJBQTlCRixnQ0FBZ0NHLE1BQU0sTUFBR0gsNEJBQUFBLFNBQVNJLGVBQWUscUJBQXhCSiwwQkFBMEJHLE1BQU0sSUFBRztJQUVoRyxNQUFNRSxlQUFlO1FBQUM7UUFBWTtLQUFXO0lBQzdDLElBQUlKLGFBQWFJLGFBQWFDLElBQUksQ0FBQztJQUNuQyxJQUFJTixTQUFTTyxZQUFZLEVBQUVGLGFBQWFDLElBQUksQ0FBQztJQUU3QyxNQUFNRSxVQUFVO1FBQ1osQ0FBQyxnQkFBZ0IsRUFBRUgsYUFBYUksSUFBSSxDQUFDLE1BQU0sZ0JBQWdCLENBQUM7UUFDNUQsQ0FBQyw4Q0FBOEMsQ0FBQztLQUNuRDtJQUVELElBQUlULFNBQVNVLGFBQWEsQ0FBQ0MsVUFBVSxFQUFFO1FBQ25DSCxRQUFRRixJQUFJLENBQUMsQ0FBQyw4QkFBOEIsQ0FBQztJQUNqRDtJQUVBRSxRQUFRRixJQUFJLENBQUMs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